import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SharedAuthenticationModule } from 'src/common/modules';
import { S3Service } from 'src/common/service';

@Module({
  imports: [SharedAuthenticationModule],
  controllers: [UserController],
  providers: [UserService , S3Service],
})
export class UserModule {}
