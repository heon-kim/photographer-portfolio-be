import { Module } from '@nestjs/common';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';
import { WorksRepository } from './works.repository';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';

@Module({
  controllers: [WorksController],
  providers: [WorksService, WorksRepository, PrismaService, S3Service],
})
export class WorksModule {}
