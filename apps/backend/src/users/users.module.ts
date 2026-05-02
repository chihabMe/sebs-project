import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule } from '@nestjs/jwt';
import { CloudinaryModule } from '../common/services/cloudinary.module';

@Module({
  imports: [JwtModule.register({}), CloudinaryModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
