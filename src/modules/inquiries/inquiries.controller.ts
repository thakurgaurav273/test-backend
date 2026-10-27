import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  type AuthenticatedAdmin,
  CurrentAdmin,
} from '../../common/decorators/current-admin.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import {
  AdminApi,
  ApiEnvelope,
} from '../../common/swagger/api-envelope.decorator';
import {
  CreateInquiryDto,
  InquiryQueryDto,
  ReplyInquiryDto,
  UpdateInquiryStatusDto,
} from './dto/inquiry.dto';
import {
  InquiryDetailEntity,
  InquiryEntity,
  InquiryReceivedEntity,
  InquiryReplyEntity,
} from './entities/inquiry.entity';
import { InquiriesService } from './inquiries.service';

@ApiTags('Inquiries')
@Public()
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  @ApiOperation({
    summary: 'Submit the contact or project inquiry form',
    description: 'Limited to 5 submissions per 10 minutes per IP.',
  })
  @ApiEnvelope(InquiryReceivedEntity, { status: 201 })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ErrorResponseDto })
  create(@Body() dto: CreateInquiryDto) {
    return this.inquiries.create(dto);
  }
}

@ApiTags('Admin / Inquiries')
@AdminApi()
@Controller('admin/inquiries')
export class AdminInquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Get()
  @ApiOperation({ summary: 'List inquiries, newest first' })
  @ApiEnvelope(InquiryEntity, { paginated: true })
  list(@Query() query: InquiryQueryDto) {
    return this.inquiries.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Inquiry with its reply history' })
  @ApiEnvelope(InquiryDetailEntity)
  findOne(@Param('id') id: string) {
    return this.inquiries.findOne(id);
  }

  @Patch(':id/status')
  @ApiEnvelope(InquiryEntity)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInquiryStatusDto) {
    return this.inquiries.updateStatus(id, dto);
  }

  @Post(':id/reply')
  @ApiOperation({
    summary: 'Reply to the visitor by email',
    description:
      'On success the inquiry becomes REPLIED. If sending fails, the attempt is saved with emailStatus FAILED and the API returns 502.',
  })
  @ApiEnvelope(InquiryReplyEntity, { status: 201 })
  @ApiBadGatewayResponse({
    type: ErrorResponseDto,
    description: 'Email could not be sent',
  })
  reply(
    @Param('id') id: string,
    @Body() dto: ReplyInquiryDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.inquiries.reply(id, dto, admin);
  }

  @Delete(':id')
  @ApiEnvelope(null)
  async remove(@Param('id') id: string) {
    await this.inquiries.remove(id);
    return { deleted: true };
  }
}
