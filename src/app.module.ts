import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { S3Service } from './s3/s3.service';
import { AboutModule } from './about/about.module';

@Module({
  imports: [AuthModule, AboutModule],
  controllers: [AppController],
  providers: [AppService, S3Service],
})
export class AppModule {}
