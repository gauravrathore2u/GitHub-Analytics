import { ApiProperty } from '@nestjs/swagger';

export class RepositoryParamsDto {
  @ApiProperty({ description: 'Repository owner (username or organization)' })
  owner!: string;

  @ApiProperty({ description: 'Repository name' })
  repo!: string;
}

export class DeveloperParamsDto extends RepositoryParamsDto {
  @ApiProperty({ description: 'GitHub username' })
  username!: string;
}

export class PullRequestDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  author!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  number!: number;

  @ApiProperty()
  url!: string;
}

export class DeveloperMetricsDto {
  @ApiProperty()
  totalPRs!: number;

  @ApiProperty()
  mergedPRs!: number;

  @ApiProperty()
  closedButNotMergedPRs!: number;

  @ApiProperty()
  closedPRs!: number;

  @ApiProperty()
  successRate!: number;

  @ApiProperty()
  averageMergeTimeHours!: number;
}

export class TimingMetricsDto {
  @ApiProperty()
  averageTimeToMergeHours!: number;

  @ApiProperty({ type: [Object] })
  longestRunningPRs!: Array<{
    title: string;
    number: number;
    author: string;
    daysOpen: number;
    url: string;
  }>;
}
