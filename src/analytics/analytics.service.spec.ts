import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

const mockUsersService = {
  findById: jest.fn(),
  getDecryptedPat: jest.fn(),
};
const mockConfigService = {};

const mockOctokit = {
  pulls: {
    list: jest.fn(),
  },
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest
      .spyOn(service as any, 'getOctokitForUser')
      .mockImplementation(() => Promise.resolve(mockOctokit as any));
  });

  describe('getOpenPullRequests', () => {
    it('should return open pull requests', async () => {
      mockOctokit.pulls.list.mockResolvedValue({
        data: [
          {
            title: 'PR 1',
            user: { login: 'dev1' },
            created_at: '2023-01-01T00:00:00Z',
            state: 'open',
            number: 1,
            html_url: 'http://example.com/pr1',
          },
        ],
      });
      const prs = await service.getOpenPullRequests(
        'owner',
        'repo',
        'username',
      );
      expect(prs).toEqual([
        {
          title: 'PR 1',
          author: 'dev1',
          createdAt: '2023-01-01T00:00:00Z',
          status: 'open',
          number: 1,
          url: 'http://example.com/pr1',
        },
      ]);
    });
  });

  describe('getDeveloperPullRequests', () => {
    it('should return developer metrics', async () => {
      mockOctokit.pulls.list.mockResolvedValue({
        data: [
          {
            user: { login: 'dev1' },
            created_at: '2023-01-01T00:00:00Z',
            merged_at: '2023-01-02T00:00:00Z',
            closed_at: '2023-01-02T00:00:00Z',
            state: 'closed',
            number: 1,
            html_url: 'http://example.com/pr1',
            title: 'PR 1',
          },
          {
            user: { login: 'dev1' },
            created_at: '2023-01-03T00:00:00Z',
            merged_at: null,
            closed_at: '2023-01-04T00:00:00Z',
            state: 'closed',
            number: 2,
            html_url: 'http://example.com/pr2',
            title: 'PR 2',
          },
          {
            user: { login: 'dev2' },
            created_at: '2023-01-05T00:00:00Z',
            merged_at: null,
            closed_at: null,
            state: 'open',
            number: 3,
            html_url: 'http://example.com/pr3',
            title: 'PR 3',
          },
        ],
      });
      const metrics = await service.getDeveloperPullRequests(
        'owner',
        'repo',
        'dev1',
        'username',
      );
      expect(metrics.totalPRs).toBe(2);
      expect(metrics.mergedPRs).toBe(1);
      expect(metrics.closedPRs).toBe(1);
      expect(metrics.closedButNotMergedPRs).toBe(1);
      expect(metrics.successRate).toBeCloseTo(50);
      expect(metrics.averageMergeTimeHours).toBeCloseTo(24);
    });
  });

  describe('getPullRequestTimingMetrics', () => {
    it('should return timing metrics', async () => {
      const now = new Date();
      const openCreated = new Date(
        now.getTime() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString();
      mockOctokit.pulls.list.mockResolvedValue({
        data: [
          {
            user: { login: 'dev1' },
            created_at: openCreated,
            merged_at: null,
            closed_at: null,
            state: 'open',
            number: 1,
            html_url: 'http://example.com/pr1',
            title: 'PR 1',
          },
          {
            user: { login: 'dev2' },
            created_at: '2023-01-01T00:00:00Z',
            merged_at: '2023-01-02T00:00:00Z',
            closed_at: '2023-01-02T00:00:00Z',
            state: 'closed',
            number: 2,
            html_url: 'http://example.com/pr2',
            title: 'PR 2',
          },
        ],
      });
      const metrics = await service.getPullRequestTimingMetrics(
        'owner',
        'repo',
        'username',
      );
      expect(metrics.averageTimeToMergeHours).toBeCloseTo(24);
      expect(metrics.longestRunningPRs[0].daysOpen).toBeGreaterThanOrEqual(4);
      expect(metrics.longestRunningPRs[0].title).toBe('PR 1');
    });
  });
});
