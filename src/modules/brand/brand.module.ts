import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { S3Service } from 'src/common/service';
import { BrandRepository, ProductRepository } from 'src/DB/Repository';
import { BrandModel, ProductModel } from 'src/DB/models';
import { SharedAuthenticationModule } from 'src/common/modules';
import { DatabaseService } from 'src/DB/service/database.service';

@Module({
  imports : [BrandModel , SharedAuthenticationModule , ProductModel],
  controllers: [BrandController],
  providers: [BrandService , S3Service , BrandRepository , ProductRepository , DatabaseService],
})
export class BrandModule {}
