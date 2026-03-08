import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AboutModule } from './about/about.module';
import { WorksModule } from './works/works.module';
import { HomeModule } from './home/home.module';

@Module({
  imports: [AuthModule, AboutModule, WorksModule, HomeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
