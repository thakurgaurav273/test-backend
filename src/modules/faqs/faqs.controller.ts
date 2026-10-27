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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  AdminApi,
  ApiEnvelope,
} from '../../common/swagger/api-envelope.decorator';
import { CreateFaqDto, FaqQueryDto, UpdateFaqDto } from './dto/faq.dto';
import { FaqEntity } from './entities/faq.entity';
import { FaqsService } from './faqs.service';

@ApiTags('FAQs')
@Public()
@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  @ApiOperation({ summary: 'Published FAQs, optionally filtered by category' })
  @ApiEnvelope(FaqEntity, { isArray: true })
  findPublished(@Query() query: FaqQueryDto) {
    return this.faqs.findPublished(query);
  }
}

@ApiTags('Admin / FAQs')
@AdminApi()
@Controller('admin/faqs')
export class AdminFaqsController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  @ApiEnvelope(FaqEntity, { isArray: true })
  findAll() {
    return this.faqs.findAll();
  }

  @Get(':id')
  @ApiEnvelope(FaqEntity)
  findOne(@Param('id') id: string) {
    return this.faqs.findOne(id);
  }

  @Post()
  @ApiEnvelope(FaqEntity, { status: 201 })
  create(@Body() dto: CreateFaqDto) {
    return this.faqs.create(dto);
  }

  @Patch(':id')
  @ApiEnvelope(FaqEntity)
  update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqs.update(id, dto);
  }

  @Delete(':id')
  @ApiEnvelope(null)
  async remove(@Param('id') id: string) {
    await this.faqs.remove(id);
    return { deleted: true };
  }
}
