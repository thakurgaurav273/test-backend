import request from 'supertest';
import {
  ADMIN,
  createTestApp,
  loginToken,
  TestContext,
  TRUSTED_ORIGIN,
} from './utils';

describe('Auth & security (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('rejects a wrong password with the standard error envelope', async () => {
    const res = await request(ctx.http)
      .post('/api/auth/login')
      .send({ email: ADMIN.email, password: 'wrong-password' })
      .expect(401);
    expect(res.body).toEqual({
      success: false,
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });

  it('validates the login body', async () => {
    const res = await request(ctx.http)
      .post('/api/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toEqual(
      expect.arrayContaining(['email must be an email']),
    );
  });

  it('answers malformed JSON with 400, not 500', async () => {
    const res = await request(ctx.http)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ')
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  it('logs in, sets an httpOnly cookie and never returns the password hash', async () => {
    const res = await request(ctx.http)
      .post('/api/auth/login')
      .send({ email: ADMIN.email.toUpperCase(), password: ADMIN.password })
      .expect(200);

    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.admin.email).toBe(ADMIN.email);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/token=.+; Max-Age=86400;.*HttpOnly/);
    expect(cookie).toContain('SameSite=Lax');
  });

  it('protects admin routes', async () => {
    await request(ctx.http).get('/api/auth/me').expect(401);
    await request(ctx.http).get('/api/admin/inquiries').expect(401);
    await request(ctx.http).post('/api/admin/blogs').send({}).expect(401);
    await request(ctx.http)
      .get('/api/admin/hero')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
  });

  it('accepts the bearer token and the cookie', async () => {
    const token = await loginToken(ctx.http);
    const bearer = await request(ctx.http)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(bearer.body.data.email).toBe(ADMIN.email);
    await request(ctx.http)
      .get('/api/auth/me')
      .set('Cookie', `token=${token}`)
      .expect(200);
  });

  it('blocks cookie-authenticated writes from untrusted origins (CSRF)', async () => {
    const token = await loginToken(ctx.http);
    const body = { question: 'Is this a CSRF test?', answer: 'Yes it is.' };

    await request(ctx.http)
      .post('/api/admin/faqs')
      .set('Cookie', `token=${token}`)
      .set('Origin', 'https://evil.example')
      .send(body)
      .expect(403);
    await request(ctx.http)
      .post('/api/admin/faqs')
      .set('Cookie', `token=${token}`)
      .set('Origin', TRUSTED_ORIGIN)
      .send(body)
      .expect(201);
  });

  it('rejects tokens of deactivated admins', async () => {
    const token = await loginToken(ctx.http);
    await ctx.prisma.admin.update({
      where: { email: ADMIN.email },
      data: { isActive: false },
    });
    await request(ctx.http)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
    await ctx.prisma.admin.update({
      where: { email: ADMIN.email },
      data: { isActive: true },
    });
  });

  it('changes the password only with the current one', async () => {
    const token = await loginToken(ctx.http);
    const auth = { Authorization: `Bearer ${token}` };
    await request(ctx.http)
      .patch('/api/auth/password')
      .set(auth)
      .send({ currentPassword: 'nope', newPassword: 'Another-Strong-Pass-1' })
      .expect(401);
    await request(ctx.http)
      .patch('/api/auth/password')
      .set(auth)
      .send({ currentPassword: ADMIN.password, newPassword: 'weak' })
      .expect(400);
  });

  it('clears the cookie on logout', async () => {
    const res = await request(ctx.http).post('/api/auth/logout').expect(200);
    expect(String(res.headers['set-cookie'])).toMatch(
      /token=;.*Expires=Thu, 01 Jan 1970/,
    );
  });

  it('serves the Swagger document', async () => {
    const res = await request(ctx.http).get('/api/docs-json').expect(200);
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining(['/api/blogs', '/api/inquiries']),
    );
  });

  it('rate limits login attempts', async () => {
    // Earlier tests in this file already used part of the 10-per-15-minutes budget.
    let status = 0;
    for (let i = 0; i < 12 && status !== 429; i++) {
      const res = await request(ctx.http)
        .post('/api/auth/login')
        .send({ email: ADMIN.email, password: 'x' });
      status = res.status;
    }
    expect(status).toBe(429);
  });
});
