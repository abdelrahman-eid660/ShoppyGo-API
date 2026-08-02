import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SharedAuthenticationModule } from 'src/common/modules';
import { S3Service } from 'src/common/service';
import { CartModel, StockAlertModel, WishlistModel } from 'src/DB/models';
import { CartRepository, StockAlertRepository, WishlistRepository } from 'src/DB/Repository';
import { DatabaseService } from 'src/DB/service/database.service';
import { SecurityService } from 'src/common/service/security';

@Module({
  imports: [SharedAuthenticationModule , CartModel , StockAlertModel , WishlistModel],
  controllers: [UserController],
  providers: [UserService , SecurityService , DatabaseService , S3Service , StockAlertRepository , CartRepository , WishlistRepository],
})
export class UserModule {}
