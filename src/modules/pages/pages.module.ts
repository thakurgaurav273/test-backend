import { Module } from '@nestjs/common';
import { AdminPagesController, PagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({
  controllers: [PagesController, AdminPagesController],
  providers: [PagesService],
})
export class PagesModule {}
