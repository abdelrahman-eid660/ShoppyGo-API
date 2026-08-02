import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types , Schema as MongooseSchema} from 'mongoose';
import { NotificationTypeEnum, ReferenceModelEnum } from 'src/common/enum';
import { INotification } from 'src/common/interface';

export type HNotificationDocument = HydratedDocument<INotification>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class Notification implements Partial<INotification> {
  @Prop({ type: Types.ObjectId, ref: 'User', required: function(this : HNotificationDocument){
    return !this.isSystem
  }})
  senderId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipientId!: Types.ObjectId ;

  @Prop({ type: String , required : true })
  title!: string;
  @Prop({type : MongooseSchema.Types.Mixed , required : true, default: {} })
  body!: string | Record<string , any> ;
    
  @Prop({ type: Types.ObjectId, refPath: 'referenceModel', required: true })
  referenceId!: Types.ObjectId ;
  @Prop({type : String , enum : ReferenceModelEnum , required : true})
  referenceModel!: ReferenceModelEnum ;
  @Prop({type : String , enum : NotificationTypeEnum , required : true})
  type!: NotificationTypeEnum ;

  @Prop({ type: Boolean, default: false })
  isRead!: boolean;
  @Prop({ type: Boolean, default: false })
  isSystem!: boolean;

  @Prop({ type: Date , index : true , default : Date.now , expires: 7 * 24 * 60 * 60 })
  createdAt!: Date;
  @Prop({ type: Date })
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
export const NotificationModel = MongooseModule.forFeature([
  {
    name: Notification.name,
    schema: NotificationSchema,
  },
]);
