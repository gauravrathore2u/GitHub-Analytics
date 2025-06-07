/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/users.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

describe('AuthController', () => {
  let controller: AuthController;

  const mockUsersService = {
    createOrUpdate: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('githubAuth', () => {
    it('should be defined', () => {
      expect(() => controller.githubAuth()).toBeDefined();
    });
  });

  describe('githubAuthCallback', () => {
    const mockUser = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.jpg',
      accessToken: 'mock-token',
    };

    const mockResponse = {
      redirect: jest.fn(),
    } as unknown as Response;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create or update user and redirect to home', async () => {
      const mockRequest = {
        user: mockUser,
      };

      mockUsersService.createOrUpdate.mockResolvedValue(mockUser);

      await controller.githubAuthCallback(mockRequest as any, mockResponse);

      expect(mockUsersService.createOrUpdate).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
    });

    it('should handle missing user data', async () => {
      const mockRequest = {
        user: null,
      };

      await expect(
        controller.githubAuthCallback(mockRequest as any, mockResponse),
      ).rejects.toThrow('User not found in request');

      expect(mockUsersService.createOrUpdate).not.toHaveBeenCalled();
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    it('should handle user service errors', async () => {
      const mockRequest = {
        user: mockUser,
      };

      mockUsersService.createOrUpdate.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(
        controller.githubAuthCallback(mockRequest as any, mockResponse),
      ).rejects.toThrow('Service error');

      expect(mockUsersService.createOrUpdate).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });
  });
});
