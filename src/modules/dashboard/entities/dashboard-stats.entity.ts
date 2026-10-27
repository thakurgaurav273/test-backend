export class InquiryStatsEntity {
  total: number;
  new: number;
  inProgress: number;
  replied: number;
}

export class BlogStatsEntity {
  published: number;
  draft: number;
}

export class DashboardStatsEntity {
  inquiries: InquiryStatsEntity;
  blogs: BlogStatsEntity;
  projects: number;
  services: number;
  testimonials: number;
  faqs: number;
}
