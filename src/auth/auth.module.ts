import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { GithubStrategy } from './github.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PassportModule, ConfigModule, UsersModule, HttpModule],
  controllers: [AuthController],
  providers: [GithubStrategy],
})
export class AuthModule {}
