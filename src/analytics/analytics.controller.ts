import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  DeveloperMetricsDto,
  DeveloperParamsDto,
  PullRequestDto,
  RepositoryParamsDto,
  TimingMetricsDto,
} from './dto/pull-request.dto';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('repos/:owner/:repo/pulls')
  @ApiOperation({ summary: 'Get all open pull requests for a repository' })
  @ApiResponse({ status: 200, type: [PullRequestDto] })
  async getOpenPullRequests(
    @Param() params: RepositoryParamsDto,
    @Req() req: Request,
  ): Promise<PullRequestDto[]> {
    const username = extractUsername(req.user);
    return this.analyticsService.getOpenPullRequests(
      params.owner,
      params.repo,
      username,
    );
  }

  @Get('repos/:owner/:repo/developers/:username')
  @ApiOperation({
    summary: 'Get pull request metrics for a specific developer',
  })
  @ApiResponse({ status: 200, type: DeveloperMetricsDto })
  async getDeveloperPullRequests(
    @Param() params: DeveloperParamsDto,
    @Req() req: Request,
  ): Promise<DeveloperMetricsDto> {
    const username = extractUsername(req.user);
    return this.analyticsService.getDeveloperPullRequests(
      params.owner,
      params.repo,
      params.username,
      username,
    );
  }

  @Get('repos/:owner/:repo/timing')
  @ApiOperation({ summary: 'Get pull request timing metrics' })
  @ApiResponse({ status: 200, type: TimingMetricsDto })
  async getPullRequestTimingMetrics(
    @Param() params: RepositoryParamsDto,
    @Req() req: Request,
  ): Promise<TimingMetricsDto> {
    const username = extractUsername(req.user);
    return this.analyticsService.getPullRequestTimingMetrics(
      params.owner,
      params.repo,
      username,
    );
  }
}

function extractUsername(user: unknown): string {
  if (!user) return '';
  if (typeof user === 'string') return user;
  if (typeof user === 'object' && user !== null) {
    const u = user as Record<string, unknown>;
    if (typeof u.username === 'string') return u.username;
    // fallback to sub/id/_id/userId if username is not present
    if (typeof u.sub === 'string') return u.sub;
    if (typeof u.id === 'string') return u.id;
    if (typeof u._id === 'string') return u._id;
    if (typeof u.userId === 'string') return u.userId;
  }
  return '';
}
