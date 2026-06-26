import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('recommend')
  recommend(@Query('prompt') prompt: string) {
    return this.aiService.recommendFromMenu(prompt);
  }

  @Post('translate')
  translate(
    @Body() body: { text: string; targetLanguage: 'Thai' | 'English' },
  ) {
    return this.aiService.translate(body.text, body.targetLanguage);
  }
}
