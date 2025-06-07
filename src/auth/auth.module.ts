import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { Auth } from './auth';

@Module({
  controllers: [AuthController],
  providers: [Auth],
})
export class AuthModule {}
