import request from 'supertest';
import { createTestApp, loginToken, TestContext } from './utils';

describe('Content & blog (e2e)', () => {
  let ctx: TestContext;
  let auth: { Authorization: string };

  beforeAll(async () => {
    ctx = await createTestApp();
    auth = { Authorization: `Bearer ${await loginToken(ctx.http)}` };
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const blog = {
    title: 'Why We Chose NestJS',
    excerpt: 'A short look at the framework behind our APIs.',
    content: '# Hello\n\nBody text.',
    authorName: 'ZoyCoders Team',
    tags: ['NestJS', 'Backend'],
  };

  it('runs the full blog lifecycle: draft -> publish -> unpublish', async () => {
    const category = await request(ctx.http)
      .post('/api/admin/blog-categories')
      .set(auth)
      .send({ name: 'Engineering' })
      .expect(201);
    expect(category.body.data.slug).toBe('engineering');

    const created = await request(ctx.http)
      .post('/api/admin/blogs')
      .set(auth)
      .send({ ...blog, categoryId: category.body.data.id })
      .expect(201);
    const post = created.body.data;
    expect(post).toMatchObject({
      slug: 'why-we-chose-nestjs',
      status: 'DRAFT',
      publishedAt: null,
    });
    expect(post.seoTitle).toBe(blog.title);
    expect(post.seoDescription).toBe(blog.excerpt);
    expect(post.tags.map((t: { slug: string }) => t.slug)).toEqual([
      'backend',
      'nestjs',
    ]);

    // Drafts are invisible to the public API.
    await request(ctx.http).get(`/api/blogs/${post.slug}`).expect(404);
    expect(
      (await request(ctx.http).get('/api/blogs').expect(200)).body.data.meta
        .total,
    ).toBe(0);

    const published = await request(ctx.http)
      .post(`/api/admin/blogs/${post.id}/publish`)
      .set(auth)
      .expect(200);
    expect(published.body.data.publishedAt).not.toBeNull();

    const list = await request(ctx.http)
      .get('/api/blogs?tag=nestjs&category=engineering')
      .expect(200);
    expect(list.body.data.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(list.body.data.items[0]).not.toHaveProperty('content');

    const detail = await request(ctx.http)
      .get(`/api/blogs/${post.slug}`)
      .expect(200);
    expect(detail.body.data.content).toBe(blog.content);
    expect(detail.body.data.category.name).toBe('Engineering');

    const sitemap = await request(ctx.http).get('/api/sitemap').expect(200);
    expect(sitemap.body.data.blogs).toEqual([
      { slug: post.slug, updatedAt: expect.any(String) },
    ]);

    await request(ctx.http)
      .post(`/api/admin/blogs/${post.id}/unpublish`)
      .set(auth)
      .expect(200);
    await request(ctx.http).get(`/api/blogs/${post.slug}`).expect(404);
  });

  it('enforces unique slugs', async () => {
    const res = await request(ctx.http)
      .post('/api/admin/blogs')
      .set(auth)
      .send(blog)
      .expect(409);
    expect(res.body.message).toBe('A record with this slug already exists');
  });

  it('rejects unknown fields, bad slugs and missing required fields', async () => {
    const unknown = await request(ctx.http)
      .post('/api/admin/blogs')
      .set(auth)
      .send({ ...blog, slug: 'another-post', isAdmin: true })
      .expect(400);
    expect(unknown.body.errors).toContain('property isAdmin should not exist');

    await request(ctx.http)
      .post('/api/admin/blogs')
      .set(auth)
      .send({ ...blog, slug: 'Bad Slug!' })
      .expect(400);
    const missing = await request(ctx.http)
      .post('/api/admin/blogs')
      .set(auth)
      .send({ title: 'Only a title' })
      .expect(400);
    expect(missing.body.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects a category that does not exist', async () => {
    await request(ctx.http)
      .post('/api/admin/blogs')
      .set(auth)
      .send({
        ...blog,
        slug: 'with-missing-category',
        categoryId: 'does-not-exist',
      })
      .expect(400);
  });

  it('replaces tags on update and keeps the original publish date', async () => {
    const created = await request(ctx.http)
      .post('/api/admin/blogs')
      .set(auth)
      .send({ ...blog, slug: 'tag-update', status: 'PUBLISHED' })
      .expect(201);
    const { id, publishedAt } = created.body.data;

    const updated = await request(ctx.http)
      .patch(`/api/admin/blogs/${id}`)
      .set(auth)
      .send({ tags: ['DevOps'] })
      .expect(200);
    expect(updated.body.data.tags.map((t: { name: string }) => t.name)).toEqual(
      ['DevOps'],
    );

    await request(ctx.http)
      .post(`/api/admin/blogs/${id}/unpublish`)
      .set(auth)
      .expect(200);
    const again = await request(ctx.http)
      .post(`/api/admin/blogs/${id}/publish`)
      .set(auth)
      .expect(200);
    expect(again.body.data.publishedAt).toBe(publishedAt);
  });

  it('only exposes published services, projects, testimonials, FAQs and pages', async () => {
    await request(ctx.http)
      .post('/api/admin/services')
      .set(auth)
      .send({
        title: 'Website Development',
        shortDescription: 'Fast, modern websites.',
        isPublished: true,
        technologies: ['Next.js'],
      })
      .expect(201);
    await request(ctx.http)
      .post('/api/admin/services')
      .set(auth)
      .send({
        title: 'Secret Draft Service',
        shortDescription: 'Not visible yet.',
      })
      .expect(201);
    await request(ctx.http)
      .post('/api/admin/projects')
      .set(auth)
      .send({
        title: 'Featured Project',
        summary: 'A featured case study.',
        isPublished: true,
        isFeatured: true,
        demoUrl: 'https://example.com',
      })
      .expect(201);
    await request(ctx.http)
      .post('/api/admin/projects')
      .set(auth)
      .send({
        title: 'Regular Project',
        summary: 'A regular case study.',
        isPublished: true,
      })
      .expect(201);
    await request(ctx.http)
      .post('/api/admin/pages')
      .set(auth)
      .send({
        title: 'Privacy Policy',
        content: 'We respect your privacy.',
        isPublished: true,
      })
      .expect(201);

    const services = await request(ctx.http).get('/api/services').expect(200);
    expect(services.body.data.map((s: { slug: string }) => s.slug)).toEqual([
      'website-development',
    ]);
    await request(ctx.http)
      .get('/api/services/secret-draft-service')
      .expect(404);

    const featured = await request(ctx.http)
      .get('/api/projects?featured=true')
      .expect(200);
    expect(featured.body.data.map((p: { title: string }) => p.title)).toEqual([
      'Featured Project',
    ]);
    expect(
      (await request(ctx.http).get('/api/projects').expect(200)).body.data,
    ).toHaveLength(2);

    const page = await request(ctx.http)
      .get('/api/pages/privacy-policy')
      .expect(200);
    expect(page.body.data.title).toBe('Privacy Policy');
  });

  it('validates link and URL fields on hero sections', async () => {
    await request(ctx.http)
      .post('/api/admin/hero')
      .set(auth)
      .send({ heading: 'Hello there', primaryCtaUrl: 'javascript:alert(1)' })
      .expect(400);
    const hero = await request(ctx.http)
      .post('/api/admin/hero')
      .set(auth)
      .send({
        heading: 'Hello there',
        primaryCtaUrl: '/contact',
        isPublished: true,
      })
      .expect(201);
    await request(ctx.http)
      .patch(`/api/admin/hero/${hero.body.data.id}`)
      .set(auth)
      .send({ isPublished: false })
      .expect(200);
    expect(
      (await request(ctx.http).get('/api/hero').expect(200)).body.data,
    ).toHaveLength(0);
  });

  it('returns 404 for unknown ids', async () => {
    const res = await request(ctx.http)
      .patch('/api/admin/faqs/unknown-id')
      .set(auth)
      .send({ answer: 'Updated answer' })
      .expect(404);
    expect(res.body).toMatchObject({
      success: false,
      message: 'FAQ not found',
    });
  });
});
