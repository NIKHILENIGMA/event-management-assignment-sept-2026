import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from '../../email/email.service';

@Processor('notificationQueue')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.name} - ID: ${job.id}`);

    if (job.name === 'booking-confirmation') {
      const { email, eventTitle, quantity } = job.data;
      const subject = `Booking Confirmed: ${eventTitle}`;
      const body = `You have successfully booked ${quantity} ticket(s) for ${eventTitle}.`;
      await this.emailService.sendEmail(email, subject, body);
    } 
    else if (job.name === 'event-update-notification') {
      const { email, eventTitle } = job.data;
      const subject = `Event Updated: ${eventTitle}`;
      const body = `An event you booked tickets for (${eventTitle}) has been updated by the organizer.`;
      await this.emailService.sendEmail(email, subject, body);
    }
  }
}
