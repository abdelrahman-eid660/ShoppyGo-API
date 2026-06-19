import { BadRequestException, NotFoundException } from "@nestjs/common";
import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { IBrand, IUser } from "src/common/interface";
import { generateSlug } from "src/common/utils/slug";

export type HBrandDocument = HydratedDocument<IBrand>

@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
    strict: true,
    strictQuery: true,
})
export class Brand implements IBrand{
    @Prop({type : String , unique : true , index : true, required : true , minLength : 2 , maxLength : 50})
    name!: string;
    @Prop({type : Types.ObjectId , ref : "User" , index : true , required : true})
    createdBy!: Types.ObjectId | IUser;
    @Prop({type : Types.ObjectId , ref : "User" , index : true })
    updatedBy?: Types.ObjectId | IUser | undefined;
    @Prop({type : String , required : true})
    logo!: string;
    @Prop({type : String})
    slug!: string;
    @Prop({type : Date})
    deletedAt?: Date | undefined;
    @Prop({type : Date})
    restoredAt?: Date | undefined;
    @Prop({type : Date})
    createdAt!: Date;
    @Prop({type : Date})
    updatedAt!: Date;
}
export const BrandSchema = SchemaFactory.createForClass(Brand)
export const BrandModel = MongooseModule.forFeatureAsync([
    {
        name : Brand.name,
        useFactory :()=>{
            BrandSchema.pre("save" , function(this : HBrandDocument){
                if (this.name) {
                    this.slug = generateSlug(this.name)
                }
            })
            BrandSchema.pre(['find', 'findOne', 'countDocuments'], function () {
                const query = this.getQuery();
                if (query.paranoid === false) {
                    this.setQuery({ ...query });
                } else {
                    this.setQuery({ ...query, deletedAt: { $exists: false } });
                }
            });
            BrandSchema.pre(['updateOne', 'findOneAndUpdate'], async function () {
                const update = this.getUpdate() as HydratedDocument<IBrand>;
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
            BrandSchema.pre(['deleteOne', 'findOneAndDelete'], async function () {
                const query = this.getQuery();
                const brand = await this.model.findOne(query);
                if (!brand) {
                    throw new NotFoundException('brand not found');
                }
                const force = query?.force;
                if (!brand.deletedAt && !force) {
                  throw new BadRequestException('Brand is not soft deleted. Use force delete to permanently remove it.');
                }
            });
            BrandSchema.pre('aggregate', function () {
                const opts = this.options || {};
                if (opts.allowDeleted === false) {
                    this.pipeline().unshift({
                        $match: { deletedAt: { $exists: false } },
                    });
                }
            });
            return BrandSchema
        }
    }
])