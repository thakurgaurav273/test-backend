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
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import {
  AdminApi,
  ApiEnvelope,
} from '../../common/swagger/api-envelope.decorator';
import {
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectEntity } from './entities/project.entity';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@Public()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Published portfolio projects' })
  @ApiEnvelope(ProjectEntity, { isArray: true })
  findPublished(@Query() query: ProjectQueryDto) {
    return this.projects.findPublished(query);
  }

  @Get(':slug')
  @ApiEnvelope(ProjectEntity)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.projects.findPublishedBySlug(slug);
  }
}

@ApiTags('Admin / Projects')
@AdminApi()
@Controller('admin/projects')
export class AdminProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiEnvelope(ProjectEntity, { isArray: true })
  findAll() {
    return this.projects.findAll();
  }

  @Get(':id')
  @ApiEnvelope(ProjectEntity)
  findOne(@Param('id') id: string) {
    return this.projects.findOne(id);
  }

  @Post()
  @ApiEnvelope(ProjectEntity, { status: 201 })
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @Patch(':id')
  @ApiEnvelope(ProjectEntity)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, dto);
  }

  @Delete(':id')
  @ApiEnvelope(null)
  async remove(@Param('id') id: string) {
    await this.projects.remove(id);
    return { deleted: true };
  }
}
