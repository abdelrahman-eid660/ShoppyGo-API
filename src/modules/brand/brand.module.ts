import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { S3Service } from 'src/common/service';
import { BrandRepository } from 'src/DB/Repository';
import { BrandModel } from 'src/DB/models';
import { SharedAuthenticationModule } from 'src/common/modules';
import { BrandMapper } from './mappers/brand.mappers';

@Module({
  imports : [BrandModel , SharedAuthenticationModule],
  controllers: [BrandController],
  providers: [BrandService , S3Service , BrandRepository , BrandMapper],
})
export class BrandModule {}
