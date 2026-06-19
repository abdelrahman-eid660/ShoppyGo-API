import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Brand, BrandSchema, Category, CategorySchema, Product, ProductSchema } from '../models';
import { IndexSyncService } from './syncIndexs';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Brand.name, schema: BrandSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  providers: [IndexSyncService],
})
export class IndexSyncModule {}