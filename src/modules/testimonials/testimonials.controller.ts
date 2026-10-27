import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  AdminApi,
  ApiEnvelope,
} from '../../common/swagger/api-envelope.decorator';
import {
  CreateTestimonialDto,
  UpdateTestimonialDto,
} from './dto/testimonial.dto';
import { TestimonialEntity } from './entities/testimonial.entity';
import { TestimonialsService } from './testimonials.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../generated/prisma/client';

@ApiTags('Testimonials')
@Public()
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  @ApiOperation({ summary: 'Published testimonials' })
  @ApiEnvelope(TestimonialEntity, { isArray: true })
  findPublished() {
    return this.testimonials.findPublished();
  }
}

@ApiTags('Admin / Testimonials')
@Roles(AdminRole.CONTENT)
@AdminApi()
@Controller('admin/testimonials')
export class AdminTestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  @ApiEnvelope(TestimonialEntity, { isArray: true })
  findAll() {
    return this.testimonials.findAll();
  }

  @Get(':id')
  @ApiEnvelope(TestimonialEntity)
  findOne(@Param('id') id: string) {
    return this.testimonials.findOne(id);
  }

  @Post()
  @ApiEnvelope(TestimonialEntity, { status: 201 })
  create(@Body() dto: CreateTestimonialDto) {
    return this.testimonials.create(dto);
  }

  @Patch(':id')
  @ApiEnvelope(TestimonialEntity)
  update(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) {
    return this.testimonials.update(id, dto);
  }

  @Delete(':id')
  @ApiEnvelope(null)
  async remove(@Param('id') id: string) {
    await this.testimonials.remove(id);
    return { deleted: true };
  }
}
