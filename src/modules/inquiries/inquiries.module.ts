import { Module } from '@nestjs/common';
import {
  AdminInquiriesController,
  InquiriesController,
} from './inquiries.controller';
import { InquiriesService } from './inquiries.service';

@Module({
  controllers: [InquiriesController, AdminInquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
