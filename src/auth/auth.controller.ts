import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Types } from 'mongoose';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Sign up a new user',
    description:
      'Creates a new user account with username, password, and GitHub PAT.',
  })
  @ApiResponse({
    status: 201,
    description: 'Signup successful! Please login',
    schema: {
      example: {
        message: 'Signup successful!, Please login',
        userId: '60d0fe4f5311236168a109ca',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or password mismatch',
    schema: {
      example: {
        statusCode: 400,
        message: 'Password and confirm password do not match',
        error: 'Bad Request',
      },
    },
  })
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'johndoe' },
        password: { type: 'string', example: 'password123' },
        confirmPassword: { type: 'string', example: 'password123' },
        githubPat: { type: 'string', example: 'ghp_XXXXXXXXXXXXXXXXXXXX' },
      },
      required: ['username', 'password', 'confirmPassword', 'githubPat'],
    },
  })
  async signup(
    @Body()
    body: {
      username: string;
      password: string;
      confirmPassword: string;
      githubPat: string;
    },
  ) {
    if (body.password !== body.confirmPassword) {
      throw new Error('Password and confirm password do not match');
    }
    const user = await this.usersService.signup(body);

    let userId = '';
    if (user && user._id) {
      if (typeof user._id === 'string') {
        userId = user._id;
      } else if (user._id instanceof Types.ObjectId) {
        userId = user._id.toString();
      }
    }
    return { message: 'Signup successful!, Please login', userId };
  }

  @Post('login')
  @ApiOperation({
    summary: 'Log in an existing user',
    description: 'Authenticates a user and returns a JWT access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'johndoe' },
        password: { type: 'string', example: 'password123' },
      },
      required: ['username', 'password'],
    },
  })
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.usersService.validateUser(
      body.username,
      body.password,
    );
    if (!user) throw new UnauthorizedException('Invalid credentials');
    let userId = '';
    if (user && user._id) {
      if (typeof user._id === 'string') {
        userId = user._id;
      } else if (user._id instanceof Types.ObjectId) {
        userId = user._id.toString();
      }
    }
    const payload = { sub: userId, username: user.username };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '24h' });
    // Save the accessToken to the user document with expiry
    await this.usersService.updateAccessToken(userId, accessToken);
    return { accessToken };
  }
}
