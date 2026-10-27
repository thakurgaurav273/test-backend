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
import { CreatePageDto, UpdatePageDto } from './dto/page.dto';
import { PageEntity } from './entities/page.entity';
import { PagesService } from './pages.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../generated/prisma/client';

@ApiTags('Pages')
@Public()
@Controller('pages')
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @Get(':slug')
  @ApiOperation({
    summary: 'Published CMS page, e.g. privacy-policy or terms-and-conditions',
  })
  @ApiEnvelope(PageEntity)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.pages.findPublishedBySlug(slug);
  }
}

@ApiTags('Admin / Pages')
@Roles(AdminRole.CONTENT)
@AdminApi()
@Controller('admin/pages')
export class AdminPagesController {
  constructor(private readonly pages: PagesService) {}

  @Get()
  @ApiEnvelope(PageEntity, { isArray: true })
  findAll() {
    return this.pages.findAll();
  }

  @Get(':id')
  @ApiEnvelope(PageEntity)
  findOne(@Param('id') id: string) {
    return this.pages.findOne(id);
  }

  @Post()
  @ApiEnvelope(PageEntity, { status: 201 })
  create(@Body() dto: CreatePageDto) {
    return this.pages.create(dto);
  }

  @Patch(':id')
  @ApiEnvelope(PageEntity)
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pages.update(id, dto);
  }

  @Delete(':id')
  @ApiEnvelope(null)
  async remove(@Param('id') id: string) {
    await this.pages.remove(id);
    return { deleted: true };
  }
}
