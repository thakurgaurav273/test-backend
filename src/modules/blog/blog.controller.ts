import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublishStatus } from '../../generated/prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import {
  AdminApi,
  ApiEnvelope,
} from '../../common/swagger/api-envelope.decorator';
import { BlogPostsService } from './blog-posts.service';
import { BlogTaxonomyService } from './blog-taxonomy.service';
import {
  AdminBlogQueryDto,
  BlogQueryDto,
  CreateBlogPostDto,
  UpdateBlogPostDto,
} from './dto/blog-post.dto';
import {
  CreateBlogCategoryDto,
  CreateBlogTagDto,
  UpdateBlogCategoryDto,
  UpdateBlogTagDto,
} from './dto/taxonomy.dto';
import {
  BlogCategoryEntity,
  BlogPostEntity,
  BlogPostSummaryEntity,
  BlogTagEntity,
} from './entities/blog.entity';

@ApiTags('Blog')
@Public()
@Controller()
export class BlogController {
  constructor(
    private readonly posts: BlogPostsService,
    private readonly taxonomy: BlogTaxonomyService,
  ) {}

  @Get('blogs')
  @ApiOperation({
    summary:
      'Published posts, newest first. Filter by category/tag slug or search text.',
  })
  @ApiEnvelope(BlogPostSummaryEntity, { paginated: true })
  list(@Query() query: BlogQueryDto) {
    return this.posts.listPublished(query);
  }

  @Get('blogs/:slug')
  @ApiOperation({
    summary: 'A published post with content, category, tags and SEO fields',
  })
  @ApiEnvelope(BlogPostEntity)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findBySlug(@Param('slug') slug: string) {
    return this.posts.findPublishedBySlug(slug);
  }

  @Get('blog-categories')
  @ApiEnvelope(BlogCategoryEntity, { isArray: true })
  categories() {
    return this.taxonomy.listCategories();
  }

  @Get('blog-tags')
  @ApiEnvelope(BlogTagEntity, { isArray: true })
  tags() {
    return this.taxonomy.listTags();
  }
}

@ApiTags('Admin / Blog')
@AdminApi()
@Controller('admin/blogs')
export class AdminBlogController {
  constructor(private readonly posts: BlogPostsService) {}

  @Get()
  @ApiOperation({ summary: 'All posts including drafts' })
  @ApiEnvelope(BlogPostSummaryEntity, { paginated: true })
  list(@Query() query: AdminBlogQueryDto) {
    return this.posts.listAll(query);
  }

  @Get(':id')
  @ApiEnvelope(BlogPostEntity)
  findOne(@Param('id') id: string) {
    return this.posts.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a post (draft unless status is PUBLISHED)' })
  @ApiEnvelope(BlogPostEntity, { status: 201 })
  create(@Body() dto: CreateBlogPostDto) {
    return this.posts.create(dto);
  }

  @Patch(':id')
  @ApiEnvelope(BlogPostEntity)
  update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.posts.update(id, dto);
  }

  @Post(':id/publish')
  @HttpCode(200)
  @ApiEnvelope(BlogPostEntity)
  publish(@Param('id') id: string) {
    return this.posts.setStatus(id, PublishStatus.PUBLISHED);
  }

  @Post(':id/unpublish')
  @HttpCode(200)
  @ApiEnvelope(BlogPostEntity)
  unpublish(@Param('id') id: string) {
    return this.posts.setStatus(id, PublishStatus.DRAFT);
  }

  @Delete(':id')
  @ApiEnvelope(null)
  async remove(@Param('id') id: string) {
    await this.posts.remove(id);
    return { deleted: true };
  }
}

@ApiTags('Admin / Blog')
@AdminApi()
@Controller('admin')
export class AdminBlogTaxonomyController {
  constructor(private readonly taxonomy: BlogTaxonomyService) {}

  @Post('blog-categories')
  @ApiEnvelope(BlogCategoryEntity, { status: 201 })
  createCategory(@Body() dto: CreateBlogCategoryDto) {
    return this.taxonomy.createCategory(dto);
  }

  @Patch('blog-categories/:id')
  @ApiEnvelope(BlogCategoryEntity)
  updateCategory(@Param('id') id: string, @Body() dto: UpdateBlogCategoryDto) {
    return this.taxonomy.updateCategory(id, dto);
  }

  @Delete('blog-categories/:id')
  @ApiOperation({
    summary: 'Delete a category (its posts become uncategorised)',
  })
  @ApiEnvelope(null)
  async removeCategory(@Param('id') id: string) {
    await this.taxonomy.removeCategory(id);
    return { deleted: true };
  }

  @Post('blog-tags')
  @ApiEnvelope(BlogTagEntity, { status: 201 })
  createTag(@Body() dto: CreateBlogTagDto) {
    return this.taxonomy.createTag(dto);
  }

  @Patch('blog-tags/:id')
  @ApiEnvelope(BlogTagEntity)
  updateTag(@Param('id') id: string, @Body() dto: UpdateBlogTagDto) {
    return this.taxonomy.updateTag(id, dto);
  }

  @Delete('blog-tags/:id')
  @ApiEnvelope(null)
  async removeTag(@Param('id') id: string) {
    await this.taxonomy.removeTag(id);
    return { deleted: true };
  }
}
