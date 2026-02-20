import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AboutService } from './about.service';
import { type UpdateAboutDto } from './dto/update-about.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
}
