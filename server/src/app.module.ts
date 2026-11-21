import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app-config';
import { LinksModule } from './modules/links/links.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [AppConfigModule, PrismaModule, LinksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
