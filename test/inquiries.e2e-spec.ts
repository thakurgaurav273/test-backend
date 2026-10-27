import request from 'supertest';
import { createTestApp, loginToken, mailMock, TestContext } from './utils';

describe('Inquiries (e2e)', () => {
  let ctx: TestContext;
  let auth: { Authorization: string };

  const inquiry = {
    name: 'Priya Sharma',
    email: 'Priya@Example.com',
    subject: 'Need a company website',
    message: 'Hello, we would like a new website for our <b>business</b>.',
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    auth = { Authorization: `Bearer ${await loginToken(ctx.http)}` };
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(() => mailMock.send.mockReset());

  it('validates the public form', async () => {
    const res = await request(ctx.http)
      .post('/api/inquiries')
      .send({ ...inquiry, email: 'nope', message: 'short' })
      .expect(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        'email must be an email',
        'message must be longer than or equal to 10 characters',
      ]),
    );
    await request(ctx.http)
      .post('/api/inquiries')
      .send({ ...inquiry, subject: 'Line one\nBcc: x@y.z' })
      .expect(400);
  });

  it('accepts a submission, then the admin replies by email', async () => {
    const created = await request(ctx.http)
      .post('/api/inquiries')
      .send({ ...inquiry, type: 'PROJECT' })
      .expect(201);
    const { id } = created.body.data;
    expect(Object.keys(created.body.data).sort()).toEqual(['createdAt', 'id']);

    const list = await request(ctx.http)
      .get('/api/admin/inquiries?status=NEW&type=PROJECT')
      .set(auth)
      .expect(200);
    expect(list.body.data.items[0]).toMatchObject({
      id,
      email: 'priya@example.com',
      status: 'NEW',
    });

    await request(ctx.http)
      .patch(`/api/admin/inquiries/${id}/status`)
      .set(auth)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);
    await request(ctx.http)
      .patch(`/api/admin/inquiries/${id}/status`)
      .set(auth)
      .send({ status: 'DONE' })
      .expect(400);

    mailMock.send.mockResolvedValue({ ok: true });
    const reply = await request(ctx.http)
      .post(`/api/admin/inquiries/${id}/reply`)
      .set(auth)
      .send({ message: 'Thanks! Let us schedule a call.' })
      .expect(201);
    expect(reply.body.data).toMatchObject({
      emailStatus: 'SENT',
      subject: 'Re: Need a company website',
      errorMessage: null,
    });
    expect(reply.body.data.sentBy.email).toBe('admin@test.dev');

    const [sent] = mailMock.send.mock.calls[0] as [
      { to: string; html: string },
    ];
    expect(sent.to).toBe('priya@example.com');
    expect(sent.html).toContain('&lt;b&gt;business&lt;/b&gt;');

    const detail = await request(ctx.http)
      .get(`/api/admin/inquiries/${id}`)
      .set(auth)
      .expect(200);
    expect(detail.body.data.status).toBe('REPLIED');
    expect(detail.body.data.replies).toHaveLength(1);
  });

  it('records a failed email and reports it with 502', async () => {
    const created = await request(ctx.http)
      .post('/api/inquiries')
      .send(inquiry)
      .expect(201);
    const { id } = created.body.data;

    mailMock.send.mockResolvedValue({ ok: false, error: 'Connection refused' });
    const res = await request(ctx.http)
      .post(`/api/admin/inquiries/${id}/reply`)
      .set(auth)
      .send({ subject: 'Following up', message: 'Hello again' })
      .expect(502);
    expect(res.body.message).toMatch(/Email could not be sent/);

    const detail = await request(ctx.http)
      .get(`/api/admin/inquiries/${id}`)
      .set(auth)
      .expect(200);
    expect(detail.body.data.status).toBe('NEW');
    expect(detail.body.data.replies[0]).toMatchObject({
      emailStatus: 'FAILED',
      errorMessage: 'Connection refused',
    });
  });

  it('shows inquiry counts on the dashboard', async () => {
    const res = await request(ctx.http)
      .get('/api/admin/dashboard/stats')
      .set(auth)
      .expect(200);
    expect(res.body.data.inquiries).toEqual({
      total: 2,
      new: 1,
      inProgress: 0,
      replied: 1,
    });
  });

  it('rate limits public submissions', async () => {
    // Two accepted plus two rejected-by-validation submissions already counted against the 5 per 10 minutes.
    let status = 0;
    for (let i = 0; i < 6 && status !== 429; i++) {
      status = (await request(ctx.http).post('/api/inquiries').send(inquiry))
        .status;
    }
    expect(status).toBe(429);
  });
});
