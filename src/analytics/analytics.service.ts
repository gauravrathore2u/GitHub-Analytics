import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import {
  DeveloperMetricsDto,
  PullRequestDto,
  TimingMetricsDto,
} from './dto/pull-request.dto';

type PullRequest =
  RestEndpointMethodTypes['pulls']['list']['response']['data'][0];

@Injectable()
export class AnalyticsService {
  private readonly octokit: Octokit;

  constructor(private readonly configService: ConfigService) {
    const githubPat = this.configService.get<string>('GITHUB_PAT');
    if (!githubPat) {
      throw new Error('GITHUB_PAT environment variable is not set');
    }
    this.octokit = new Octokit({
      auth: githubPat,
    });
  }

  async getOpenPullRequests(
    owner: string,
    repo: string,
  ): Promise<PullRequestDto[]> {
    const response = await this.octokit.pulls.list({
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
    username: string,
  ): Promise<DeveloperMetricsDto> {
    const response = await this.octokit.pulls.list({
      owner,
      repo,
      state: 'all',
    });

    const userPRs = response.data.filter(
      (pr: PullRequest) => pr.user?.login === username,
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
        const created = new Date(pr.created_at);
        const merged = new Date(pr.merged_at as string);
        return acc + (merged.getTime() - created.getTime());
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
  ): Promise<TimingMetricsDto> {
    const response = await this.octokit.pulls.list({
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
        const created = new Date(pr.created_at);
        const merged = new Date(pr.merged_at as string);
        return acc + (merged.getTime() - created.getTime());
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
