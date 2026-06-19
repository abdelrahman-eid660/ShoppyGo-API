import { BadRequestException, Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private EMAIL_APP!: string;
  private PASSWORD_APP!: string;
  private APPLICATION_NAME!: string;
  private transporter: nodemailer.Transporter;
  constructor(private readonly configService: ConfigService) {
    this.EMAIL_APP = this.configService.get<string>('EMAIL_APP') as string;
    this.APPLICATION_NAME = this.configService.get<string>(
      'APPLICATION_NAME'
    ) as string;
    this.PASSWORD_APP = this.configService.get<string>(
      'PASSWORD_APP'
    ) as string;
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.EMAIL_APP,
        pass: this.PASSWORD_APP,
      },
    });
  }
  //================= Send Email ===============================
  async sendMail({
    to,
    cc,
    bcc,
    html,
    attachments = [],
    subject,
  }: Mail.Options): Promise<any> {
    try {
      if (!to && !cc && !bcc) {
        throw new BadRequestException('Invalid recipient');
      }
      if (!html && attachments.length === 0) {
        throw new BadRequestException('Invalid mail content');
      }
      const info = await this.transporter.sendMail({
        to,
        cc,
        bcc,
        subject,
        html,
        attachments,
        from: `${this.APPLICATION_NAME} 🛒🏪 <${this.EMAIL_APP}>`,
        replyTo: this.EMAIL_APP,
      });
      return info;
    } catch (error) {
      console.error('Email error:', error);
      throw error;
    }
  }
}
