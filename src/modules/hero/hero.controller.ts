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
import { CreateHeroDto, UpdateHeroDto } from './dto/hero.dto';
import { HeroEntity } from './entities/hero.entity';
import { HeroService } from './hero.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../generated/prisma/client';

@ApiTags('Hero')
@Public()
@Controller('hero')
export class HeroController {
  constructor(private readonly hero: HeroService) {}

  @Get()
  @ApiOperation({ summary: 'Published hero sections, in display order' })
  @ApiEnvelope(HeroEntity, { isArray: true })
  findPublished() {
    return this.hero.findPublished();
  }
}

@ApiTags('Admin / Hero')
@Roles(AdminRole.CONTENT)
@AdminApi()
@Controller('admin/hero')
export class AdminHeroController {
  constructor(private readonly hero: HeroService) {}

  @Get()
  @ApiOperation({ summary: 'All hero sections including drafts' })
  @ApiEnvelope(HeroEntity, { isArray: true })
  findAll() {
    return this.hero.findAll();
  }

  @Get(':id')
  @ApiEnvelope(HeroEntity)
  findOne(@Param('id') id: string) {
    return this.hero.findOne(id);
  }

  @Post()
  @ApiEnvelope(HeroEntity, { status: 201 })
  create(@Body() dto: CreateHeroDto) {
    return this.hero.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update, publish (isPublished: true) or unpublish a hero section',
  })
  @ApiEnvelope(HeroEntity)
  update(@Param('id') id: string, @Body() dto: UpdateHeroDto) {
    return this.hero.update(id, dto);
  }

  @Delete(':id')
  @ApiEnvelope(null)
  async remove(@Param('id') id: string) {
    await this.hero.remove(id);
    return { deleted: true };
  }
}
