import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InquiryStatus, PublishStatus } from '../../generated/prisma/client';
import {
  AdminApi,
  ApiEnvelope,
} from '../../common/swagger/api-envelope.decorator';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DashboardStatsEntity } from './entities/dashboard-stats.entity';

@ApiTags('Admin / Dashboard')
@AdminApi()
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Counts for the admin dashboard' })
  @ApiEnvelope(DashboardStatsEntity)
  async stats(): Promise<DashboardStatsEntity> {
    const [inquiries, blogs, projects, services, testimonials, faqs] =
      await Promise.all([
        this.prisma.inquiry.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.blogPost.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.project.count(),
        this.prisma.service.count(),
        this.prisma.testimonial.count(),
        this.prisma.faq.count(),
      ]);
    const inquiryCount = (status: InquiryStatus) =>
      inquiries.find((row) => row.status === status)?._count._all ?? 0;
    const blogCount = (status: PublishStatus) =>
      blogs.find((row) => row.status === status)?._count._all ?? 0;

    return {
      inquiries: {
        total: inquiries.reduce((sum, row) => sum + row._count._all, 0),
        new: inquiryCount(InquiryStatus.NEW),
        inProgress: inquiryCount(InquiryStatus.IN_PROGRESS),
        replied: inquiryCount(InquiryStatus.REPLIED),
      },
      blogs: {
        published: blogCount(PublishStatus.PUBLISHED),
        draft: blogCount(PublishStatus.DRAFT),
      },
      projects,
      services,
      testimonials,
      faqs,
    };
  }
}
