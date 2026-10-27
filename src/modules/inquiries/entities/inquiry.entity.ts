import { ApiProperty } from '@nestjs/swagger';
import {
  EmailStatus,
  Inquiry,
  InquiryReply,
  InquiryStatus,
  InquiryType,
} from '../../../generated/prisma/client';

export class InquiryEntity implements Inquiry {
  id: string;
  @ApiProperty({ enum: InquiryType, enumName: 'InquiryType' })
  type: InquiryType;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string;
  message: string;
  service: string | null;
  budget: string | null;
  @ApiProperty({ enum: InquiryStatus, enumName: 'InquiryStatus' })
  status: InquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class ReplySenderEntity {
  id: string;
  name: string;
  email: string;
}

export class InquiryReplyEntity implements InquiryReply {
  id: string;
  inquiryId: string;
  sentById: string | null;
  subject: string;
  body: string;
  /** Whether the email actually went out */
  @ApiProperty({ enum: EmailStatus, enumName: 'EmailStatus' })
  emailStatus: EmailStatus;
  /** SMTP error when emailStatus is FAILED */
  errorMessage: string | null;
  createdAt: Date;
  sentBy: ReplySenderEntity | null;
}

export class InquiryDetailEntity extends InquiryEntity {
  replies: InquiryReplyEntity[];
}

export class InquiryReceivedEntity {
  id: string;
  createdAt: Date;
}
