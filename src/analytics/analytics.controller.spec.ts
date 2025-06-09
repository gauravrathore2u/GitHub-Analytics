/* eslint-disable @typescript-eslint/unbound-method */
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PullRequestDto,
  DeveloperMetricsDto,
  TimingMetricsDto,
} from './dto/pull-request.dto';

let analyticsService: AnalyticsService;
let controller: AnalyticsController;

beforeEach(async () => {
  const mockAnalyticsService = {
    getOpenPullRequests: jest.fn<Promise<PullRequestDto[]>, [string, string]>(),
    getDeveloperPullRequests: jest.fn<
      Promise<DeveloperMetricsDto>,
      [string, string, string]
    >(),
    getPullRequestTimingMetrics: jest.fn<
      Promise<TimingMetricsDto>,
      [string, string]
    >(),
  } as unknown as AnalyticsService;
  const module: TestingModule = await Test.createTestingModule({
    controllers: [AnalyticsController],
    providers: [{ provide: AnalyticsService, useValue: mockAnalyticsService }],
  }).compile();

  controller = module.get<AnalyticsController>(AnalyticsController);
  analyticsService = module.get<AnalyticsService>(AnalyticsService);
});

it('should be defined', () => {
  expect(controller).toBeDefined();
});

describe('getOpenPullRequests', () => {
  it('should return open pull requests for a repo', async () => {
    const params = { owner: 'octocat', repo: 'hello-world' };
    const result: PullRequestDto[] = [
      {
        id: 1,
        number: 1,
        url: 'https://github.com/octocat/hello-world/pull/1',
        title: 'Test PR',
        author: 'dev1',
        createdAt: new Date().toISOString(),
        status: 'open',
        mergedAt: null,
        closedAt: null,
      } as PullRequestDto,
    ];
    const mockGetOpenPullRequests =
      analyticsService.getOpenPullRequests as jest.Mock;
    mockGetOpenPullRequests.mockResolvedValue(result);
    expect(await controller.getOpenPullRequests(params)).toBe(result);
    expect(mockGetOpenPullRequests).toHaveBeenCalledWith(
      'octocat',
      'hello-world',
    );
  });
});

describe('getDeveloperPullRequests', () => {
  it('should return developer pull request metrics', async () => {
    const params = { owner: 'octocat', repo: 'hello-world', username: 'dev1' };
    const result: DeveloperMetricsDto = {
      totalPRs: 5,
      mergedPRs: 3,
      closedButNotMergedPRs: 1,
      closedPRs: 4,
      successRate: 0.75,
      averageMergeTimeHours: 12,
    };
    const mockGetDeveloperPullRequests =
      analyticsService.getDeveloperPullRequests as jest.Mock;
    mockGetDeveloperPullRequests.mockResolvedValue(result);
    expect(await controller.getDeveloperPullRequests(params)).toBe(result);
    expect(mockGetDeveloperPullRequests).toHaveBeenCalledWith(
      'octocat',
      'hello-world',
      'dev1',
    );
  });
});

describe('getPullRequestTimingMetrics', () => {
  it('should return pull request timing metrics', async () => {
    const params = { owner: 'octocat', repo: 'hello-world' };
    const result: TimingMetricsDto = {
      averageTimeToMergeHours: 10,
      longestRunningPRs: [],
    };
    const mockGetPullRequestTimingMetrics =
      analyticsService.getPullRequestTimingMetrics as jest.Mock;
    mockGetPullRequestTimingMetrics.mockResolvedValue(result);
    expect(await controller.getPullRequestTimingMetrics(params)).toBe(result);
    expect(mockGetPullRequestTimingMetrics).toHaveBeenCalledWith(
      'octocat',
      'hello-world',
    );
  });
});
