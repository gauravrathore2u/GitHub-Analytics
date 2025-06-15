/* eslint-disable @typescript-eslint/unbound-method */
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PullRequestDto,
  DeveloperMetricsDto,
  TimingMetricsDto,
} from './dto/pull-request.dto';
import { Request } from 'express';

describe('AnalyticsController', () => {
  let analyticsService: AnalyticsService;
  let controller: AnalyticsController;

  function mockRequest(user: unknown): Request {
    return { user } as Request;
  }

  beforeEach(async () => {
    const mockAnalyticsService = {
      getOpenPullRequests: jest.fn(),
      getDeveloperPullRequests: jest.fn(),
      getPullRequestTimingMetrics: jest.fn(),
    } as unknown as AnalyticsService;
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
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
      const req = mockRequest({ sub: 'user123' });
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
      jest
        .spyOn(analyticsService, 'getOpenPullRequests')
        .mockResolvedValue(result);
      const response = await controller.getOpenPullRequests(params, req);
      expect(response).toEqual(result);
      expect(analyticsService.getOpenPullRequests).toHaveBeenCalledWith(
        'octocat',
        'hello-world',
        'user123',
      );
    });
  });

  describe('getDeveloperPullRequests', () => {
    it('should return developer pull request metrics', async () => {
      const params = {
        owner: 'octocat',
        repo: 'hello-world',
        username: 'dev1',
      };
      const req = mockRequest({ sub: 'user123' });
      const result: DeveloperMetricsDto = {
        totalPRs: 5,
        mergedPRs: 3,
        closedButNotMergedPRs: 1,
        closedPRs: 4,
        successRate: 0.75,
        averageMergeTimeHours: 12,
      };
      jest
        .spyOn(analyticsService, 'getDeveloperPullRequests')
        .mockResolvedValue(result);
      const response = await controller.getDeveloperPullRequests(params, req);
      expect(response).toEqual(result);
      expect(analyticsService.getDeveloperPullRequests).toHaveBeenCalledWith(
        'octocat',
        'hello-world',
        'dev1',
        'user123',
      );
    });
  });

  describe('getPullRequestTimingMetrics', () => {
    it('should return pull request timing metrics', async () => {
      const params = { owner: 'octocat', repo: 'hello-world' };
      const req = mockRequest({ sub: 'user123' });
      const result: TimingMetricsDto = {
        averageTimeToMergeHours: 10,
        longestRunningPRs: [],
      };
      jest
        .spyOn(analyticsService, 'getPullRequestTimingMetrics')
        .mockResolvedValue(result);
      const response = await controller.getPullRequestTimingMetrics(
        params,
        req,
      );
      expect(response).toEqual(result);
      expect(analyticsService.getPullRequestTimingMetrics).toHaveBeenCalledWith(
        'octocat',
        'hello-world',
        'user123',
      );
    });
  });
});
