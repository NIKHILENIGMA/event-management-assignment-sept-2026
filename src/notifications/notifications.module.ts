import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationProcessor } from './processors/notification.processor';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const url = configService.get<string>('UPSTASH_REDIS_URL');
        return {
          connection: {
            url,
            tls: url?.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'notificationQueue',
    }),
    EmailModule,
  ],
  providers: [NotificationsService, NotificationProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
