import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublishStatus } from '../../generated/prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { ApiEnvelope } from '../../common/swagger/api-envelope.decorator';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SitemapEntity } from './entities/sitemap.entity';

const entry = { slug: true, updatedAt: true } as const;

@ApiTags('SEO')
@Public()
@Controller('sitemap')
export class SitemapController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Slugs of all public content, for the frontend sitemap.xml',
  })
  @ApiEnvelope(SitemapEntity)
  async sitemap(): Promise<SitemapEntity> {
    const [blogs, projects, services, pages] = await Promise.all([
      this.prisma.blogPost.findMany({
        where: { status: PublishStatus.PUBLISHED },
        select: entry,
      }),
      this.prisma.project.findMany({
        where: { isPublished: true },
        select: entry,
      }),
      this.prisma.service.findMany({
        where: { isPublished: true },
        select: entry,
      }),
      this.prisma.page.findMany({
        where: { isPublished: true },
        select: entry,
      }),
    ]);
    return { blogs, projects, services, pages };
  }
}
