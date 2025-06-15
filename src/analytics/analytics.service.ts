import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import {
  DeveloperMetricsDto,
  PullRequestDto,
  TimingMetricsDto,
} from './dto/pull-request.dto';
import { UsersService } from '../users/users.service';

type PullRequest =
  RestEndpointMethodTypes['pulls']['list']['response']['data'][0];

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService, // inject UsersService
  ) {}

  private async getOctokitForUser(username: string): Promise<Octokit> {
    const user = await this.usersService.findById(username);
    if (!user) {
      throw new Error('User not found');
    }
    const pat = this.usersService.getDecryptedPat(user);
    return new Octokit({ auth: pat });
  }

  async getOpenPullRequests(
    owner: string,
    repo: string,
    username: string,
  ): Promise<PullRequestDto[]> {
    const octokit = await this.getOctokitForUser(username);
    const response = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
    });

    return response.data.map((pr) => ({
      title: pr.title,
      author: pr.user?.login || 'Unknown',
      createdAt: pr.created_at,
      status: pr.state,
      number: pr.number,
      url: pr.html_url,
    })) as PullRequestDto[];
  }

  async getDeveloperPullRequests(
    owner: string,
    repo: string,
    developerUsername: string,
    username: string,
  ): Promise<DeveloperMetricsDto> {
    const octokit = await this.getOctokitForUser(username);
    const response = await octokit.pulls.list({
      owner,
      repo,
      state: 'all',
    });

    const userPRs = response.data.filter(
      (pr: PullRequest) => pr.user?.login === developerUsername,
    );
    const mergedPRs = userPRs.filter(
      (pr: PullRequest) => pr.merged_at !== null,
    );
    const closedPRs = userPRs.filter(
      (pr: PullRequest) => pr.closed_at && !!pr.merged_at,
    );
    const closedButNotMergedPRs = userPRs.filter(
      (pr: PullRequest) => pr.closed_at && !pr.merged_at,
    );

    const averageMergeTime =
      mergedPRs.reduce((acc: number, pr: PullRequest) => {
        const created = pr.created_at ? new Date(pr.created_at) : null;
        const merged = pr.merged_at ? new Date(pr.merged_at) : null;
        if (created && merged) {
          return acc + (merged.getTime() - created.getTime());
        }
        return acc;
      }, 0) / (mergedPRs.length || 1);

    return {
      totalPRs: userPRs.length,
      mergedPRs: mergedPRs.length,
      closedPRs: closedPRs.length,
      closedButNotMergedPRs: closedButNotMergedPRs.length,
      successRate: (mergedPRs.length / userPRs.length) * 100 || 0,
      averageMergeTimeHours: averageMergeTime / (1000 * 60 * 60),
    };
  }

  async getPullRequestTimingMetrics(
    owner: string,
    repo: string,
    username: string,
  ): Promise<TimingMetricsDto> {
    const octokit = await this.getOctokitForUser(username);
    const response = await octokit.pulls.list({
      owner,
      repo,
      state: 'all',
    });

    const now = new Date();
    const openPRs = response.data.filter(
      (pr: PullRequest) => pr.state === 'open',
    );
    const mergedPRs = response.data.filter(
      (pr: PullRequest) => pr.merged_at !== null,
    );

    const averageTimeToMerge =
      mergedPRs.reduce((acc: number, pr: PullRequest) => {
        const created = pr.created_at ? new Date(pr.created_at) : null;
        const merged = pr.merged_at ? new Date(pr.merged_at) : null;
        if (created && merged) {
          return acc + (merged.getTime() - created.getTime());
        }
        return acc;
      }, 0) / (mergedPRs.length || 1);

    const longestRunningPRs = openPRs
      .map((pr: PullRequest) => ({
        title: pr.title,
        number: pr.number,
        author: pr.user?.login || 'Unknown',
        daysOpen: Math.floor(
          (now.getTime() - new Date(pr.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
        url: pr.html_url,
      }))
      .sort((a, b) => b.daysOpen - a.daysOpen)
      .slice(0, 5);

    return {
      averageTimeToMergeHours: averageTimeToMerge / (1000 * 60 * 60),
      longestRunningPRs,
    };
  }
}
