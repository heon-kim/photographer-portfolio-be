import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListWorksQueryDto } from './dto/list-works-query.dto';
import { CreateWorkImagePresignedUrlDto } from './dto/create-work-image-presigned-url.dto';

@Controller('works')
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get()
  getWorks(@Query() query: ListWorksQueryDto) {
    return this.worksService.findAll(query);
  }

  @Get(':id')
  getWork(@Param('id', ParseIntPipe) id: number) {
    return this.worksService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createWork(@Body() createWorkDto: CreateWorkDto) {
    return this.worksService.create(createWorkDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  updateWork(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkDto: UpdateWorkDto,
  ) {
    return this.worksService.update(id, updateWorkDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  deleteWork(@Param('id', ParseIntPipe) id: number) {
    return this.worksService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('image/presigned-url')
  @HttpCode(200)
  createImagePresignedUrl(
    @Body() body: CreateWorkImagePresignedUrlDto,
  ) {
    return this.worksService.createImagePresignedUrl(body);
  }
}
