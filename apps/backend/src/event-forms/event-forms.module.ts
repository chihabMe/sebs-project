import { Module } from '@nestjs/common';
import { EventFormsService } from './event-forms.service';
import { EventFormsController } from './event-forms.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  controllers: [EventFormsController],
  providers: [EventFormsService],
})
export class EventFormsModule {}
