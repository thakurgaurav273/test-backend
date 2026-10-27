import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmailStatus,
  Inquiry,
  InquiryStatus,
  Prisma,
} from '../../generated/prisma/client';
import { AuthenticatedAdmin } from '../../common/decorators/current-admin.decorator';
import { pageArgs, paginate } from '../../common/dto/pagination.dto';
import { escapeHtml, textToHtml } from '../../common/utils/html';
import { Env } from '../../config/env';
import { MailService } from '../../core/mail/mail.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CreateInquiryDto,
  InquiryQueryDto,
  ReplyInquiryDto,
  UpdateInquiryStatusDto,
} from './dto/inquiry.dto';

const replyInclude = {
  sentBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.InquiryReplyInclude;

@Injectable()
export class InquiriesService {
  private readonly logger = new Logger(InquiriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async create(dto: CreateInquiryDto) {
    const inquiry = await this.prisma.inquiry.create({ data: dto });
    void this.notifyTeam(inquiry);
    return { id: inquiry.id, createdAt: inquiry.createdAt };
  }

  async list(query: InquiryQueryDto) {
    const { status, type, search } = query;
    const where: Prisma.InquiryWhereInput = {
      ...(status && { status }),
      ...(type && { type }),
      ...(search && {
        OR: ['name', 'email', 'subject'].map((field) => ({
          [field]: { contains: search, mode: 'insensitive' },
        })),
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...pageArgs(query),
      }),
      this.prisma.inquiry.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  async findOne(id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        replies: { include: replyInclude, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    return inquiry;
  }

  async updateStatus(id: string, { status }: UpdateInquiryStatusDto) {
    await this.ensureExists(id);
    return this.prisma.inquiry.update({ where: { id }, data: { status } });
  }

  /**
   * Emails the visitor and records the attempt either way, so the admin panel
   * can show whether each reply was delivered to the mail server.
   */
  async reply(id: string, dto: ReplyInquiryDto, admin: AuthenticatedAdmin) {
    const inquiry = await this.findOne(id);
    const subject = dto.subject || `Re: ${inquiry.subject}`;
    const quoted = inquiry.message
      .split(/\r?\n/)
      .map((line) => `> ${line}`)
      .join('\n');

    const result = await this.mail.send({
      to: inquiry.email,
      subject,
      text: `${dto.message}\n\n---\n${inquiry.name} wrote:\n${quoted}`,
      html:
        `<div>${textToHtml(dto.message)}</div><hr>` +
        `<p style="color:#666">${escapeHtml(inquiry.name)} wrote:</p>` +
        `<blockquote style="color:#666;border-left:3px solid #ddd;padding-left:12px">${textToHtml(inquiry.message)}</blockquote>`,
    });

    const reply = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.inquiryReply.create({
        data: {
          inquiryId: id,
          sentById: admin.id,
          subject,
          body: dto.message,
          emailStatus: result.ok ? EmailStatus.SENT : EmailStatus.FAILED,
          errorMessage: result.ok ? null : result.error.slice(0, 500),
        },
        include: replyInclude,
      });
      if (result.ok) {
        await tx.inquiry.update({
          where: { id },
          data: { status: InquiryStatus.REPLIED },
        });
      }
      return saved;
    });

    if (!result.ok) {
      throw new BadGatewayException(
        `Email could not be sent. The failed attempt was saved (reply ${reply.id}); check the SMTP settings and try again.`,
      );
    }
    return reply;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.inquiry.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.inquiry.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Inquiry not found');
  }

  private async notifyTeam(inquiry: Inquiry) {
    const to = this.config.get('INQUIRY_NOTIFY_EMAIL', { infer: true });
    if (!to) return;
    const result = await this.mail.send({
      to,
      replyTo: inquiry.email,
      subject: `New ${inquiry.type.toLowerCase()} inquiry: ${inquiry.subject}`,
      text: `From: ${inquiry.name} <${inquiry.email}>\n\n${inquiry.message}`,
    });
    if (!result.ok)
      this.logger.warn(
        `Inquiry ${inquiry.id} notification not sent: ${result.error}`,
      );
  }
}
