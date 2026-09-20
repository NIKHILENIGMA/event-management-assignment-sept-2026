import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { ResendEmailService } from './providers/resend-email.service';
import { TestEmailService } from './providers/test-email.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EmailService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('EMAIL_PROVIDER');
        if (provider === 'resend') {
          return new ResendEmailService(configService);
        }
        return new TestEmailService();
      },
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
