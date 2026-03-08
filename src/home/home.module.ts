import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { S3Service } from '../s3/s3.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [HomeController],
  providers: [HomeService, S3Service, PrismaService],
})
export class HomeModule {}
