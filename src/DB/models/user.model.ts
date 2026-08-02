import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  GenderEnum,
  LanguageEnum,
  PermissionEnum,
  ProviderEnum,
  RoleEnum,
  RolePermissions,
} from 'src/common/enum';
import { IUser } from 'src/common/interface';
import { SecurityModule, SecurityService } from 'src/common/service/security';

export type HUserDocument = HydratedDocument<IUser>;
@Schema({ _id: false })
export class Address {
  @Prop({type : String , required : true})
  country!: string;
  
  @Prop({type : String , required : true})
  governorate!: string;
  
  @Prop({type : String , required : true})
  street!: string;
  @Prop({type : String , required : true})
  zone!: string;
  
  @Prop({type : String , required : true})
  postalCode!: number;
}

const AddressSchema = SchemaFactory.createForClass(Address);
@Schema({
  timestamps: true,
  toJSON: { virtuals: true  , getters : true},
  toObject: { virtuals: true , getters : true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class User implements IUser {
  @Prop({ type: String, required: true })
  firstName!: string;
  @Prop({ type: String, required: true })
  lastName!: string;
  @Virtual({
    set: function (this: HUserDocument, value) {
      const parts = value.trim().split(' ');
      this.firstName = parts.shift();
      this.lastName = parts.join(' ');
    },
    get: function (this: HUserDocument) {
      return `${this.firstName} ${this.lastName}`;
    },
  })
  userName?: string;
  @Prop({ type: String, required: true, unique: true, index: true })
  email!: string;
  @Prop({
    type: String,
    index: true,
    required: function (this: HUserDocument) {
      return this.provider === ProviderEnum.SYSTEM;
    },
  })
  password!: string;
  @Prop({ type: String})
  phone?: string;
  @Prop({ type: AddressSchema })
  address?: Address;
  @Prop({ type: String })
  profileImage?: string;
  @Prop({ type: String , enum : LanguageEnum , default : LanguageEnum.EN })
  lang!: LanguageEnum;
  @Prop({ type: Date })
  DOB?: Date;
  @Prop({ type: Date })
  confirmedAt!: Date;
  @Prop({
    type: Number,
    enum: ProviderEnum,
    default: ProviderEnum.SYSTEM,
    index: true,
  })
  provider!: number;
  @Prop({ type: String, enum: GenderEnum, default: GenderEnum.MALE })
  gender!: GenderEnum;
  @Prop({ type: String, enum: RoleEnum, default: RoleEnum.USER, index: true })
  role!: RoleEnum;
  @Prop({ type: [String], enum: PermissionEnum, default: RolePermissions[RoleEnum.USER], index: true })
  permissions!: PermissionEnum[];
  @Prop({ ref: 'User', index: true })
  createdBy?: Types.ObjectId;
  @Prop({ ref: 'User', index: true })
  updatedBy?: Types.ObjectId;
  @Prop({ type: Date, index: true })
  createdAt!: Date;
  @Prop({ type: Date })
  updatedAt!: Date;
  @Prop({ type: Date })
  changeCredentialsTime?: Date;
  @Prop({ type: Date, index: true })
  deletedAt?: Date;
  @Prop({ type: Date })
  restoredAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
export const UserModel = MongooseModule.forFeatureAsync([
  {
    name: User.name,
    imports: [ConfigModule, SecurityModule],
    useFactory: (
      configService: ConfigService,
      securityService: SecurityService
    ) => {
      UserSchema.pre('validate', function () {
        if (
          this.provider &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
          this.provider == ProviderEnum.GOOGLE &&
          this.password
        ) {
          throw new BadRequestException(
            "You can't send password with google email"
          );
        }
      });
      UserSchema.pre('save', async function () {
        if (this.isModified('password')) {
          this.password = await securityService.generateHash(this.password);
        }
        if (this.phone && this.isModified('phone')) {
          this.phone = await securityService.generateEncryption(this.phone);
        }
      });
      UserSchema.pre(['find', 'findOne', 'countDocuments'], function () {
        const query = this.getQuery();
        if (query.paranoid === false) {
          this.setQuery({ ...query });
        } else {
          this.setQuery({ ...query, deletedAt: { $exists: false } });
        }
      });
      UserSchema.pre(['updateOne', 'findOneAndUpdate'], async function () {
        const update = this.getUpdate() as HydratedDocument<IUser>;
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
      UserSchema.pre(['deleteOne', 'findOneAndDelete'], async function () {
        const query = this.getQuery();
        const user = await this.model.findOne(query);
        if (!user) {
          throw new NotFoundException('User not found');
        }
        const force = query?.force;
        if (!user.deletedAt && !force) {
          throw new BadRequestException(
            'Account is not soft deleted. Use force delete to permanently remove it.'
          );
        }
      });
      UserSchema.pre('aggregate', function () {
        const opts = this.options || {};
        if (opts.allowDeleted === false) {
          this.pipeline().unshift({
            $match: { deletedAt: { $exists: false } },
          });
        }
      });
      return UserSchema;
    },
    inject: [ConfigService, SecurityService],
  },
]);
