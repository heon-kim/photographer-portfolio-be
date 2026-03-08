import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HomeService } from './home.service';
import type { CreateHomeImagePresignedUrlDto } from './dto/create-home-image-presigned-url.dto';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('image/presigned-url')
  @HttpCode(200)
  createImagePresignedUrl(@Body() body: CreateHomeImagePresignedUrlDto) {
    return this.homeService.createImageUploadUrl(body);
  }
}
