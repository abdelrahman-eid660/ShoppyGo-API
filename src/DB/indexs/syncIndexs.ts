import { Injectable, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { Brand, Category, Product } from '../models';
import { InjectModel } from '@nestjs/mongoose';
@Injectable()
export class IndexSyncService implements OnModuleInit {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Brand.name) private brandModel: Model<Brand>,
    @InjectModel(Product.name) private productModel: Model<Product>
  ) {}

  async onModuleInit() {
    try {
      await Promise.all([
        this.categoryModel.syncIndexes(),
        this.brandModel.syncIndexes(),
        this.productModel.syncIndexes(),
      ]);

      console.log('✅ Indexes synced');
    } catch (err) {
      console.error('❌ Index sync failed:', err);
    }
  }
}
