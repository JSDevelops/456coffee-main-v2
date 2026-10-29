import { Controller, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('recommend')
  recommend(@Query('prompt') prompt: string) {
    return this.aiService.recommendFromMenu(prompt);
  }
}
