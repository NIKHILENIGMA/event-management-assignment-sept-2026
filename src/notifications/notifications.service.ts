import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue('notificationQueue') private notificationQueue: Queue) {}

  async queueBookingConfirmation(email: string, eventTitle: string, quantity: number) {
    await this.notificationQueue.add('booking-confirmation', {
      email,
      eventTitle,
      quantity,
    });
  }

  async queueEventUpdateNotification(email: string, eventTitle: string) {
    await this.notificationQueue.add('event-update-notification', {
      email,
      eventTitle,
    });
  }
}
