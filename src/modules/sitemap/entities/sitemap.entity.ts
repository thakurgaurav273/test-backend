export class SitemapEntryEntity {
  slug: string;
  updatedAt: Date;
}

export class SitemapEntity {
  blogs: SitemapEntryEntity[];
  projects: SitemapEntryEntity[];
  services: SitemapEntryEntity[];
  pages: SitemapEntryEntity[];
}
