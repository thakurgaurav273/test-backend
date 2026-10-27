import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import {
  AdminApi,
  ApiEnvelope,
} from '../../common/swagger/api-envelope.decorator';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { ServiceEntity } from './entities/service.entity';
import { ServicesService } from './services.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../generated/prisma/client';

@ApiTags('Services')
@Public()
@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Published services, in display order' })
  @ApiEnvelope(ServiceEntity, { isArray: true })
  findPublished() {
    return this.services.findPublished();
  }

  @Get(':slug')
  @ApiEnvelope(ServiceEntity)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.services.findPublishedBySlug(slug);
  }
}

@ApiTags('Admin / Services')
@Roles(AdminRole.CONTENT)
@AdminApi()
@Controller('admin/services')
export class AdminServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @ApiEnvelope(ServiceEntity, { isArray: true })
  findAll() {
    return this.services.findAll();
  }

  @Get(':id')
  @ApiEnvelope(ServiceEntity)
  findOne(@Param('id') id: string) {
    return this.services.findOne(id);
  }

  @Post()
  @ApiEnvelope(ServiceEntity, { status: 201 })
  create(@Body() dto: CreateServiceDto) {
    return this.services.create(dto);
  }

  @Patch(':id')
  @ApiEnvelope(ServiceEntity)
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(id, dto);
  }

  @Delete(':id')
  @ApiEnvelope(null)
  async remove(@Param('id') id: string) {
    await this.services.remove(id);
    return { deleted: true };
  }
}
