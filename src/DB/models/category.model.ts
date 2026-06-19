import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ICategory, IUser } from 'src/common/interface';
import { generateSlug } from 'src/common/utils/slug';

export type HCategoryDocument = HydratedDocument<ICategory>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class Category implements ICategory {
  @Prop({
    type: String,
    unique: true,
    index: true,
    required: true,
    minLength: 2,
    maxLength: 50,
  })
  name!: string;
  @Prop({ type: String })
  slug!: string;
  @Prop({ type: String })
  image?: string | undefined;
  @Prop({ type: Types.ObjectId, ref: 'Category', index: true })
  parentId?: Types.ObjectId | undefined;
  @Prop({ type: [{type : Types.ObjectId, ref: 'Category', index: true}] })
  ancestors?: Types.ObjectId[] | undefined;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId | IUser;
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  updatedBy?: Types.ObjectId | IUser;
  @Prop({ type: Date })
  deletedAt?: Date | undefined;
  @Prop({ type: Date })
  restoredAt?: Date | undefined;
}
export const CategorySchema = SchemaFactory.createForClass(Category);
export const CategoryModel = MongooseModule.forFeatureAsync([
  {
    name: Category.name,
    useFactory() {
      CategorySchema.pre('save', function (this: HCategoryDocument) {
        if (this.name) {
          this.slug = generateSlug(this.name);
        }
      });
      CategorySchema.pre(['find', 'findOne', 'countDocuments'], function () {
        const query = this.getQuery();
        if (query.paranoid === false) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ ...query, deletedAt: { $exists: false } });
        }
      });
      CategorySchema.pre(['updateOne', 'findOneAndUpdate'], async function () {
        const update = this.getUpdate() as HydratedDocument<ICategory>;
        const query = this.getQuery();
        if (update.restoredAt) {
          this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
          this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
        }
        if (query.paranoid === false) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ ...query, deletedAt: { $exists: false } });
        }
      });
      CategorySchema.pre(['deleteOne', 'findOneAndDelete'], async function () {
        const query = this.getQuery();
        const Category = await this.model.findOne(query);
        if (!Category) {
          throw new NotFoundException('Category not found');
        }
        const force = query?.force;
        if (!Category.deletedAt && !force) {
          throw new BadRequestException(
            'Category is not soft deleted. Use force delete to permanently remove it.'
          );
        }
      });
      CategorySchema.pre('aggregate', function () {
        const opts = this.options || {};
        if (opts.allowDeleted === false) {
          this.pipeline().unshift({
            $match: { deletedAt: { $exists: false } },
          });
        }
      });
      return CategorySchema
    },
  },
]);

