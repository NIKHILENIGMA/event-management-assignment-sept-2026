import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailService } from '../email.service';

@Injectable()
export class ResendEmailService implements EmailService {
  private resend: Resend;
  private readonly logger = new Logger(ResendEmailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: 'Event Booking <onboarding@resend.dev>', // Testing domain
        to,
        subject,
        text: body,
      });
      this.logger.log(`Real email sent via Resend to ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }
}
