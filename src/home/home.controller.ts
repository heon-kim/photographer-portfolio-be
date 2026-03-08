import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HomeService } from './home.service';
import type { CreateHomeImagePresignedUrlDto } from './dto/create-home-image-presigned-url.dto';
import type { UpdateHomeDto } from './dto/update-home.dto';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  getHome() {
    return this.homeService.getHome();
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  updateHeroImage(@Body() body: UpdateHomeDto) {
    return this.homeService.updateHeroImage(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('image/presigned-url')
  @HttpCode(200)
  createImagePresignedUrl(@Body() body: CreateHomeImagePresignedUrlDto) {
    return this.homeService.createImageUploadUrl(body);
  }
}
