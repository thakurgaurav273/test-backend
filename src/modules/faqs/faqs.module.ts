import { Module } from '@nestjs/common';
import { AdminFaqsController, FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';

@Module({
  controllers: [FaqsController, AdminFaqsController],
  providers: [FaqsService],
})
export class FaqsModule {}
