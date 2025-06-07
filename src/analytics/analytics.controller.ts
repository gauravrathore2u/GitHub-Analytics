import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  DeveloperMetricsDto,
  DeveloperParamsDto,
  PullRequestDto,
  RepositoryParamsDto,
  TimingMetricsDto,
} from './dto/pull-request.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('repos/:owner/:repo/pulls')
  @ApiOperation({ summary: 'Get all open pull requests for a repository' })
  @ApiResponse({ status: 200, type: [PullRequestDto] })
  async getOpenPullRequests(
    @Param() params: RepositoryParamsDto,
  ): Promise<PullRequestDto[]> {
    return this.analyticsService.getOpenPullRequests(params.owner, params.repo);
  }

  @Get('repos/:owner/:repo/developers/:username')
  @ApiOperation({
    summary: 'Get pull request metrics for a specific developer',
  })
  @ApiResponse({ status: 200, type: DeveloperMetricsDto })
  async getDeveloperPullRequests(
    @Param() params: DeveloperParamsDto,
  ): Promise<DeveloperMetricsDto> {
    return this.analyticsService.getDeveloperPullRequests(
      params.owner,
      params.repo,
      params.username,
    );
  }

  @Get('repos/:owner/:repo/timing')
  @ApiOperation({ summary: 'Get pull request timing metrics' })
  @ApiResponse({ status: 200, type: TimingMetricsDto })
  async getPullRequestTimingMetrics(
    @Param() params: RepositoryParamsDto,
  ): Promise<TimingMetricsDto> {
    return this.analyticsService.getPullRequestTimingMetrics(
      params.owner,
      params.repo,
    );
  }
}
