import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { S3Service } from './s3/s3.service';

@Module({
  imports: [AuthModule],
  controllers: [AppController],
  providers: [AppService, S3Service],
})
export class AppModule {}
