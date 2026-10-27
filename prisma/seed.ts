import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const services = [
  [
    'Website Development',
    'globe',
    'Fast, SEO-friendly marketing sites and company websites.',
  ],
  [
    'Mobile App Development',
    'smartphone',
    'Cross-platform iOS and Android apps with a native feel.',
  ],
  [
    'Custom Software Development',
    'code',
    'Software built around your exact business workflow.',
  ],
  [
    'Web Application Development',
    'layout',
    'Dashboards, portals and SaaS products that scale.',
  ],
  [
    'Backend/API Development',
    'server',
    'Secure, documented APIs and integrations.',
  ],
  [
    'AI Integration and Automation',
    'sparkles',
    'Practical AI features and workflow automation.',
  ],
];

const faqs = [
  [
    'How long does a typical website take?',
    'Most company websites take 3 to 6 weeks from kickoff to launch, depending on scope and content readiness.',
  ],
  [
    'Do you build both web and mobile apps?',
    'Yes. We build websites, web applications and cross-platform mobile apps, often sharing one backend.',
  ],
  [
    'Will I be able to update content myself?',
    'Yes. Every project can include an admin panel so your team can manage content without code.',
  ],
];

const pages = [
  ['Privacy Policy', 'privacy-policy'],
  ['Terms and Conditions', 'terms-and-conditions'],
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password)
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding',
    );
  if (password.length < 12)
    throw new Error('ADMIN_PASSWORD must be at least 12 characters');

  const passwordHash = await bcrypt.hash(password, 12);
  const name = process.env.ADMIN_NAME?.trim() || 'ZoyCoders Admin';
  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name, isActive: true },
    create: { email, name, passwordHash },
  });
  console.log(`Admin ready: ${email}`);
}

/** Starter content so the website and mobile app have something to render. Existing rows are left untouched. */
async function seedContent() {
  for (const [index, [title, icon, shortDescription]] of services.entries()) {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    await prisma.service.upsert({
      where: { slug },
      update: {},
      create: {
        title,
        slug,
        icon,
        shortDescription,
        sortOrder: index,
        isPublished: true,
      },
    });
  }

  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({
      data: faqs.map(([question, answer], index) => ({
        question,
        answer,
        sortOrder: index,
        isPublished: true,
      })),
    });
  }

  for (const [title, slug] of pages) {
    await prisma.page.upsert({
      where: { slug },
      update: {},
      create: {
        title,
        slug,
        content: `# ${title}\n\nReplace this placeholder from the admin panel.`,
        isPublished: true,
      },
    });
  }

  if ((await prisma.heroSection.count()) === 0) {
    await prisma.heroSection.create({
      data: {
        heading: 'We build websites, apps and software that grow your business',
        subheading: 'ZoyCoders',
        primaryCtaLabel: 'Start a project',
        primaryCtaUrl: '/contact',
        secondaryCtaLabel: 'See our work',
        secondaryCtaUrl: '/portfolio',
        isPublished: true,
      },
    });
  }
  console.log('Starter content ready');
}

seedAdmin()
  .then(seedContent)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
