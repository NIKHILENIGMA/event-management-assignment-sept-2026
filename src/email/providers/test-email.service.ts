import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email.service';

@Injectable()
export class TestEmailService implements EmailService {
  private readonly logger = new Logger(TestEmailService.name);

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // Deliberately preventing external delivery to save free quota
    // The BullMQ job processes successfully.
    this.logger.log(`[TEST EMAIL] Simulated sending to ${to} | Subject: ${subject}`);
  }
}
