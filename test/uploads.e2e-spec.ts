import request from 'supertest';
import { createTestApp, loginToken, TestContext } from './utils';

// Smallest valid PNG: 1x1 transparent pixel.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

describe('Uploads (e2e)', () => {
  let ctx: TestContext;
  let auth: { Authorization: string };

  beforeAll(async () => {
    ctx = await createTestApp();
    auth = { Authorization: `Bearer ${await loginToken(ctx.http)}` };
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('stores a real image and serves it back', async () => {
    const res = await request(ctx.http)
      .post('/api/admin/uploads')
      .set(auth)
      .field('folder', 'projects')
      .attach('file', PNG, { filename: 'pixel.png', contentType: 'image/png' })
      .expect(201);
    const { url, publicId } = res.body.data;
    expect(publicId).toMatch(/^local:projects\/[\w-]+\.png$/);

    const path = new URL(url).pathname;
    const served = await request(ctx.http).get(path).expect(200);
    expect(served.headers['content-type']).toBe('image/png');
  });

  it('deletes the old file when an image is replaced', async () => {
    const upload = async () =>
      (
        await request(ctx.http)
          .post('/api/admin/uploads')
          .set(auth)
          .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' })
          .expect(201)
      ).body.data as { url: string; publicId: string };

    const first = await upload();
    const second = await upload();
    const project = await request(ctx.http)
      .post('/api/admin/projects')
      .set(auth)
      .send({
        title: 'With image',
        summary: 'Project with an image.',
        imageUrl: first.url,
        imagePublicId: first.publicId,
      })
      .expect(201);
    await request(ctx.http)
      .patch(`/api/admin/projects/${project.body.data.id}`)
      .set(auth)
      .send({ imageUrl: second.url, imagePublicId: second.publicId })
      .expect(200);

    await request(ctx.http).get(new URL(first.url).pathname).expect(404);
    await request(ctx.http).get(new URL(second.url).pathname).expect(200);
  });

  it('rejects files whose content is not an image, even with an image type', async () => {
    const res = await request(ctx.http)
      .post('/api/admin/uploads')
      .set(auth)
      .attach('file', Buffer.from('<?php echo "hi"; ?> padding padding'), {
        filename: 'evil.png',
        contentType: 'image/png',
      })
      .expect(400);
    expect(res.body.message).toMatch(/Only JPEG, PNG, WebP or GIF/);
  });

  it('rejects disallowed types and oversized files', async () => {
    await request(ctx.http)
      .post('/api/admin/uploads')
      .set(auth)
      .attach('file', Buffer.from('<svg/>'), {
        filename: 'x.svg',
        contentType: 'image/svg+xml',
      })
      .expect(415);
    await request(ctx.http)
      .post('/api/admin/uploads')
      .set(auth)
      .attach('file', Buffer.concat([PNG, Buffer.alloc(1024 * 1024 + 1)]), {
        filename: 'big.png',
        contentType: 'image/png',
      })
      .expect(413);
  });

  it('requires a file, a valid folder and an admin', async () => {
    await request(ctx.http).post('/api/admin/uploads').set(auth).expect(400);
    await request(ctx.http)
      .post('/api/admin/uploads')
      .set(auth)
      .field('folder', '../../etc')
      .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' })
      .expect(400);
    await request(ctx.http)
      .post('/api/admin/uploads')
      .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' })
      .expect(401);
  });
});
