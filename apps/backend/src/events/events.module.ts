import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { CloudinaryModule } from '../common/services/cloudinary.module';

@Module({
  imports: [JwtModule.register({}), MailModule, CloudinaryModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
