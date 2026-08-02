import { CouponRepository } from './../../DB/Repository';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AllCouponDTO, CreateCouponDto, UpdateCouponDto } from './dto';
import { HUserDocument } from 'src/DB/models';
import { ICoupon, IPagination } from 'src/common/interface';
import { CouponSortEnum, CouponTypeEnum, LogActionEnum, ReferenceModelEnum, RoleEnum, SortEnum } from 'src/common/enum';
import { S3Service } from 'src/common/service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);
  constructor(
    private readonly couponRepository: CouponRepository , 
    private readonly s3 : S3Service,
    private readonly eventEmitter: EventEmitter2
  ) {}
  async create(data: CreateCouponDto, user: HUserDocument): Promise<ICoupon> {
    const expiresAt = new Date(data.expiresAt);
    expiresAt.setHours(23, 59, 59, 999);
    const couponExist = await this.couponRepository.findOne({filter: { code: data.code }});
    if (couponExist) {
      throw new ConflictException('Coupon already exist');
    }
    const coupon = await this.couponRepository.create({data: { ...data , expiresAt, createdBy: user._id }});
    if (!coupon) {
      throw new BadRequestException('Fail to create coupon');
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.COUPON_CREATE,referenceId: coupon._id,
      referenceModel: ReferenceModelEnum.COUPON,
      metadata: { 
        code: coupon.code, type: coupon.type, 
        discount: coupon.type === CouponTypeEnum.PERCENT ? `${coupon.value}%` : `${coupon.value} EGP`
      }
    });
    this.eventEmitter.emit('coupon.created', {
      couponId: coupon._id,code: coupon.code,
      discount: coupon.type === CouponTypeEnum.PERCENT ? `${coupon.value}%` : `${coupon.value} EGP`,
      expiresAt: coupon.expiresAt,actorId: user._id,
    });
    return coupon;
  }

  async findAll(query: AllCouponDTO , user : HUserDocument):Promise<IPagination<ICoupon>> {
    if (user.role === RoleEnum.USER) {
      const {limit = 4 , page = 1 , sort = SortEnum.NEWEST,search,type , isActive} = query;
      const sortOptions = CouponSortEnum[sort] || CouponSortEnum[SortEnum.NEWEST];
      const coupons = await this.couponRepository.paginate({
        filter: {
          ...(search && { code: new RegExp(search, 'i') }),
          ...(type && {type}),
          ...(isActive !== undefined && { isActive }),
        },
        limit,page,sort: sortOptions,projection : "image slug code value"
      });
      return coupons;
    }else{
      const {limit = 4 , page = 1 , sort = SortEnum.NEWEST,search,type , isActive} = query;
      const sortOptions = CouponSortEnum[sort] || CouponSortEnum[SortEnum.NEWEST];
      const coupons = await this.couponRepository.paginate({
        filter: {
          ...(search && { code: new RegExp(search, 'i') }),
          ...(type && {type}),
          ...(isActive !== undefined && { isActive }),
        },
        limit,page,sort: sortOptions,options: {populate: [{ path: 'createdBy', select: 'firstName lastName profileImage role' }]},
      });
      return coupons;
    }
  }

  async findOne(couponId: Types.ObjectId , user : HUserDocument):Promise<ICoupon> {
    if (user.role === RoleEnum.USER) {
      const coupon = await this.couponRepository.findOne({filter : {_id : couponId , isActive : true} , 
        projection : "expiresAt startAt description minOrderAmount value type image slug code"
      })
      if (!coupon) {
        throw new NotFoundException("Coupon not found")
      }
      return coupon
    }else{
      const coupon = await this.couponRepository.findOne({filter : {_id : couponId} , options : {populate : [{path : "createdBy" , select : "firstName lastName role profileImage"},{path : "updatedBy" , select : "firstName lastName role profileImage"}]}})
      if (!coupon) {
        throw new NotFoundException("Coupon not found")
      }
      return coupon
    }
  }

  async update(couponId: Types.ObjectId, data: UpdateCouponDto, user: HUserDocument): Promise<ICoupon> {
    const couponExist = await this.couponRepository.findOne({ filter: { _id: couponId } });
    if (!couponExist) {
      throw new NotFoundException("Coupon not found");
    }
    
    let expiresAt: Date = couponExist.expiresAt;
    if (data.expiresAt) {
      expiresAt = new Date(data.expiresAt);
      expiresAt.setHours(23, 59, 59, 999);
    }

    let coupon!: any;
    if (data.type === CouponTypeEnum.FIXED && couponExist.type === CouponTypeEnum.PERCENT) {
      coupon = await this.couponRepository.findOneAndUpdate({
        filter: { _id: couponId }, 
        update: { $set: { ...data, expiresAt, updatedBy: user._id }, $unset: { maxDiscountAmount: 1 } },
        options: { returnDocument: "before" }
      });
    } else {
      coupon = await this.couponRepository.findOneAndUpdate({
        filter: { _id: couponId }, 
        update: { $set: { ...data, expiresAt, updatedBy: user._id } },
        options: { returnDocument: "before" }
      });
    }

    if (!coupon) {
      throw new BadRequestException("Fail to update coupon"); 
    }

    if (data.image !== undefined && data.image !== couponExist.image && couponExist.image) {
      void this.s3.deleteAsset({ Key: couponExist.image }).catch(err => {
        this.logger.error(`Failed to delete old coupon image from S3: ${err.message}`);
      });
    }

    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.COUPON_UPDATE,
      referenceId: couponId,referenceModel: ReferenceModelEnum.COUPON,
      metadata: { code: couponExist.code, changedFields: Object.keys(data) }
    });

    this.eventEmitter.emit('coupon.updated', {
      couponId: couponId,code: couponExist.code,
      changedFields: Object.keys(data),actorId: user._id,
    });
    return coupon;
  }

  async disable(couponId: Types.ObjectId , user : HUserDocument) : Promise<ICoupon> {
    const coupon = await this.couponRepository.findOneAndUpdate({filter : {_id : couponId , isActive : true} , update : {isActive : false}})
    if (!coupon) {
      throw new NotFoundException("Coupon not found")
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.COUPON_DISABLE,
      referenceId: couponId,referenceModel: ReferenceModelEnum.COUPON,
      metadata: { code: coupon.code, status: 'DISABLED' }
    });
    this.eventEmitter.emit('coupon.disabled', {couponId: couponId,code: coupon.code, actorId: user._id});
    return  coupon
  }
}
