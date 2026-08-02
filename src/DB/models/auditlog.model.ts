import {
  MongooseModule,
  Prop,
  raw,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LogActionEnum, ReferenceModelEnum } from 'src/common/enum';
import { IAuditlog } from 'src/common/interface';
import { Schema as MongooseSchema } from "mongoose";
export type HAuditlogDocument = HydratedDocument<IAuditlog>;
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class Auditlog implements Partial<IAuditlog> {
    @Prop({type : Types.ObjectId , ref : "User" , required : function(this : HAuditlogDocument){
        return this.isSystem !== true
    }})
    actorId?:Types.ObjectId;

    @Prop({type : Boolean , default : false})
    isSystem?: boolean;
    
    @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
    metadata?: Record<string, any>;

    @Prop({type : Types.ObjectId , refPath : "referenceModel" , required : true})
    referenceId!: Types.ObjectId;
    @Prop({type : String , enum : ReferenceModelEnum , required : true})
    referenceModel!: ReferenceModelEnum;

    @Prop({type : String , enum : LogActionEnum , required : true})
    action!: LogActionEnum ;

    @Prop({ type: Date, index: true })
    createdAt!: Date;
    @Prop({ type: Date })
    updatedAt!: Date;
}
export const AuditlogSchema = SchemaFactory.createForClass(Auditlog);
export const AuditlogModel = MongooseModule.forFeature([
  { name: Auditlog.name, schema: AuditlogSchema },
]);
