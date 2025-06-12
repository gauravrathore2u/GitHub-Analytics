import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('AuthController', () => {
  let controller: AuthController;
  let mockUsersService: {
    signup: jest.Mock;
    validateUser: jest.Mock;
    updateAccessToken: jest.Mock;
  };
  let mockJwtService: {
    sign: jest.Mock;
  };

  beforeEach(async () => {
    mockUsersService = {
      signup: jest.fn(),
      validateUser: jest.fn(),
      updateAccessToken: jest.fn(),
    };
    mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should sign up a new user when passwords match', async () => {
      const body = {
        username: 'testuser',
        password: 'password',
        confirmPassword: 'password',
        githubPat: 'pat',
      };
      const user = { _id: 'abc123' };
      mockUsersService.signup.mockResolvedValue(user);
      const result = await controller.signup(body);
      expect(mockUsersService.signup).toHaveBeenCalledWith(body);
      expect(result).toEqual({
        message: 'Signup successful!, Please login',
        userId: 'abc123',
      });
    });

    it('should throw error if passwords do not match', async () => {
      const body = {
        username: 'testuser',
        password: 'password',
        confirmPassword: 'notmatch',
        githubPat: 'pat',
      };
      await expect(controller.signup(body)).rejects.toThrow(
        'Password and confirm password do not match',
      );
      expect(mockUsersService.signup).not.toHaveBeenCalled();
    });

    it('should handle ObjectId as user._id', async () => {
      const body = {
        username: 'testuser',
        password: 'password',
        confirmPassword: 'password',
        githubPat: 'pat',
      };
      // Use a real Types.ObjectId for proper instanceof check
      const objectId = new Types.ObjectId('507f1f77bcf86cd799439011');
      const user = { _id: objectId };
      mockUsersService.signup.mockResolvedValue(user);
      const result = await controller.signup(body);
      expect(result).toEqual({
        message: 'Signup successful!, Please login',
        userId: objectId.toString(),
      });
    });
  });

  describe('login', () => {
    it('should return accessToken for valid credentials', async () => {
      const body = { username: 'testuser', password: 'password' };
      const user = { _id: 'abc123', username: 'testuser' };
      mockUsersService.validateUser.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockUsersService.updateAccessToken.mockResolvedValue(undefined);
      const result = await controller.login(body);
      expect(mockUsersService.validateUser).toHaveBeenCalledWith(
        'testuser',
        'password',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: 'abc123', username: 'testuser' },
        { expiresIn: '24h' },
      );
      expect(mockUsersService.updateAccessToken).toHaveBeenCalledWith(
        'abc123',
        'jwt-token',
      );
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });

    it('should handle ObjectId as user._id', async () => {
      const body = { username: 'testuser', password: 'password' };
      const objectId = new Types.ObjectId('507f1f77bcf86cd799439012');
      const user = { _id: objectId, username: 'testuser' };
      mockUsersService.validateUser.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockUsersService.updateAccessToken.mockResolvedValue(undefined);
      const result = await controller.login(body);
      expect(mockUsersService.updateAccessToken).toHaveBeenCalledWith(
        objectId.toString(),
        'jwt-token',
      );
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const body = { username: 'testuser', password: 'wrong' };
      mockUsersService.validateUser.mockResolvedValue(null);
      await expect(controller.login(body)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersService.validateUser).toHaveBeenCalledWith(
        'testuser',
        'wrong',
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
