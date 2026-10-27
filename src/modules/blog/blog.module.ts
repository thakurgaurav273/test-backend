import { Module } from '@nestjs/common';
import { BlogPostsService } from './blog-posts.service';
import { BlogTaxonomyService } from './blog-taxonomy.service';
import {
  AdminBlogController,
  AdminBlogTaxonomyController,
  BlogController,
} from './blog.controller';

@Module({
  controllers: [
    BlogController,
    AdminBlogController,
    AdminBlogTaxonomyController,
  ],
  providers: [BlogPostsService, BlogTaxonomyService],
})
export class BlogModule {}
