import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { BlogModule } from './modules/blog/blog.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { validateEnv } from './config/env';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FaqsModule } from './modules/faqs/faqs.module';
import { HealthModule } from './modules/health/health.module';
import { HeroModule } from './modules/hero/hero.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { MailModule } from './core/mail/mail.module';
import { PagesModule } from './modules/pages/pages.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ServicesModule } from './modules/services/services.module';
import { SitemapModule } from './modules/sitemap/sitemap.module';
import { StorageModule } from './core/storage/storage.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    // Default limit for every route; login and inquiries set stricter limits.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    PrismaModule,
    StorageModule,
    MailModule,
    AuthModule,
    AdminUsersModule,
    UploadsModule,
    HeroModule,
    ServicesModule,
    ProjectsModule,
    BlogModule,
    TestimonialsModule,
    FaqsModule,
    PagesModule,
    InquiriesModule,
    DashboardModule,
    SitemapModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
