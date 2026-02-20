import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AboutService } from './about.service';
import { type UpdateAboutDto } from './dto/update-about.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { type CreateAboutImagePresignedUrlDto } from './dto/create-about-image-presigned-url.dto';

@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  getAbout() {
    return this.aboutService.getAbout();
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  updateAbout(@Body() updateAboutDto: UpdateAboutDto) {
    return this.aboutService.updateAbout(updateAboutDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('image/presigned-url')
  @HttpCode(200)
  createImagePresignedUrl(@Body() body: CreateAboutImagePresignedUrlDto) {
    return this.aboutService.createImageUploadUrl(body);
  }
}
