import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Check server running' })
  @ApiResponse({ status: 200, description: 'server is up!' })
  getServerStatus(): string {
    return this.appService.getServerStatus();
  }
}
