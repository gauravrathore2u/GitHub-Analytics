import { Controller, Get, UseGuards, Req, Res, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface GitHubUserResponse {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'Initiate GitHub OAuth authentication',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to GitHub for authentication',
  })
  async githubAuth() {
    // This route will redirect to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'GitHub OAuth callback endpoint',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend after successful authentication',
  })
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as {
      id: string;
      username: string;
      email: string;
      avatar: string;
      accessToken: string;
    };

    if (!user) {
      throw new Error('User not found in request');
    }

    // Save or update user in database
    await this.usersService.createOrUpdate(user);

    // For now, we'll just redirect to the frontend
    res.redirect('/');
  }

  @Post('pat/initialize')
  @ApiOperation({
    summary: 'Initialize user profile with GitHub Personal Access Token',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile initialized successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'GitHub PAT not configured or invalid',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to initialize user profile',
  })
  async initializeWithPat(@Res() res: Response) {
    const pat = this.configService.get<string>('GITHUB_PAT');

    if (!pat) {
      throw new Error('GitHub PAT not configured');
    }

    try {
      // Fetch user data from GitHub API using HttpService
      const { data } = await firstValueFrom(
        this.httpService.get<GitHubUserResponse>(
          'https://api.github.com/user',
          {
            headers: {
              Authorization: `Bearer ${pat}`,
            },
          },
        ),
      );

      if (!data) {
        throw new Error('No user data received from GitHub');
      }

      const userData = {
        id: data.id.toString(),
        username: data.login,
        email: data.email ?? '',
        avatar: data.avatar_url,
        accessToken: pat,
      };

      // Save or update user in database
      await this.usersService.createOrUpdate(userData);

      res.json({ message: 'User profile initialized successfully' });
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw new Error(`GitHub API error: ${error.message}`);
      }
      throw new Error('Failed to initialize user profile with PAT');
    }
  }
}
