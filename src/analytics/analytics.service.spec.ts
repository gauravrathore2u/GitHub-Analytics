import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import type { Matchers } from '@jest/expect';

type PullRequest =
  RestEndpointMethodTypes['pulls']['list']['response']['data'][0];

type JestMatchers = Matchers<void>;

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockOctokit: {
    pulls: {
      list: jest.Mock;
    };
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-github-pat'),
  };

  const mockPullRequest: PullRequest = {
    title: 'Test PR',
    user: { login: 'testuser' },
    created_at: '2024-01-01T00:00:00Z',
    state: 'open',
    number: 1,
    html_url: 'https://github.com/test/repo/pull/1',
    merged_at: null,
    closed_at: null,
  } as PullRequest;

  beforeEach(async () => {
    mockOctokit = {
      pulls: {
        list: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Octokit,
          useValue: mockOctokit,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    // Override the octokit instance in the service
    Object.defineProperty(service, 'octokit', { value: mockOctokit });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOpenPullRequests', () => {
    it('should return open pull requests', async () => {
      const mockResponse = {
        data: [mockPullRequest],
      };
      mockOctokit.pulls.list.mockResolvedValue(mockResponse);

      const result = await service.getOpenPullRequests('owner', 'repo');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        title: 'Test PR',
        author: 'testuser',
        createdAt: '2024-01-01T00:00:00Z',
        status: 'open',
        number: 1,
        url: 'https://github.com/test/repo/pull/1',
      });
      expect(mockOctokit.pulls.list).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        state: 'open',
      });
    });
  });

  describe('getDeveloperPullRequests', () => {
    it('should return developer metrics', async () => {
      const mockPRs: PullRequest[] = [
        { ...mockPullRequest, merged_at: '2024-01-02T00:00:00Z' },
        {
          ...mockPullRequest,
          number: 2,
          closed_at: '2024-01-03T00:00:00Z',
          merged_at: '2024-01-03T00:00:00Z',
        },
        { ...mockPullRequest, number: 3, closed_at: '2024-01-04T00:00:00Z' },
      ];
      mockOctokit.pulls.list.mockResolvedValue({ data: mockPRs });

      const result = await service.getDeveloperPullRequests(
        'owner',
        'repo',
        'testuser',
      );

      expect(result).toEqual({
        totalPRs: 3,
        mergedPRs: 2,
        closedPRs: 1,
        closedButNotMergedPRs: 1,
        successRate: (2 / 3) * 100,
        averageMergeTimeHours: expect.any(Number) as JestMatchers,
      });
    });
  });

  describe('getPullRequestTimingMetrics', () => {
    it('should return timing metrics', async () => {
      const mockPRs: PullRequest[] = [
        { ...mockPullRequest, merged_at: '2024-01-02T00:00:00Z' },
        { ...mockPullRequest, number: 2, state: 'open' },
        { ...mockPullRequest, number: 3, state: 'open' },
      ];
      mockOctokit.pulls.list.mockResolvedValue({ data: mockPRs });

      const result = await service.getPullRequestTimingMetrics('owner', 'repo');

      expect(result).toEqual({
        averageTimeToMergeHours: expect.any(Number) as JestMatchers,
        longestRunningPRs: expect.arrayContaining([
          expect.objectContaining({
            title: 'Test PR',
            number: expect.any(Number) as JestMatchers,
            author: 'testuser',
            daysOpen: expect.any(Number) as JestMatchers,
            url: expect.any(String) as JestMatchers,
          }),
        ]) as JestMatchers,
      });
      expect(result.longestRunningPRs).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    it('should throw error when GITHUB_PAT is not set', () => {
      mockConfigService.get.mockReturnValue(null);
      expect(() => new AnalyticsService(mockConfigService as any)).toThrow(
        'GITHUB_PAT environment variable is not set',
      );
    });
  });
});
