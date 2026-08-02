import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReviewRepository , ProductVariantRepository } from './../../DB/Repository';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { HUserDocument } from 'src/DB/models';
import { Types } from 'mongoose';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { IPagination, IProductVariant, IReview } from 'src/common/interface';
import { SortEnum } from 'src/common/enum';
import { AllReviewsDTO, CreateReviewDto, RejectReviewDTO, UpdateReviewDto } from './dto';
import { Filter } from 'bad-words';

@Injectable()
export class ReviewService {
  private readonly filter = new Filter()
  constructor(
    private readonly reviewRepository : ReviewRepository,
    private readonly productVariantRepository : ProductVariantRepository,
    private readonly eventEmitter : EventEmitter2,
  ){}

  async create({rating , variantId , comment}: CreateReviewDto , user : HUserDocument) : Promise<IReview> {
    variantId = TransformToObjectId(variantId as unknown as string)
    const variantExists = await this.productVariantRepository.findOne({filter : {_id : variantId , isPublished : true}})
    if(!variantExists) throw new NotFoundException(`This ${variantId.toString()} not exists `)
    const isBad = this.filter.isProfane(comment as string)
    const isApproved = isBad ? false : true
    let review: IReview;
      try {
        review = await this.reviewRepository.create({ data: {rating, comment,variantId,productId: variantExists.productId,isApproved,variantSnapshot: variantExists.sku,createdBy: user._id}});
      } catch (error :any) {
        if (error.code === 11000) {
          throw new ConflictException('You have already reviewed this product variant');
        }
        console.error('DATABASE CREATE ERROR:', error);
        throw new BadRequestException("Fail to create this review");
      }
    if (isApproved) {
      this.eventEmitter.emit('review.created', {
        reviewId: review._id, productId: variantExists.productId,
        variantId, userId: user._id, rating,comment,sku: variantExists.sku,
      });
    }else {
      this.eventEmitter.emit('review.flagged', {
        reviewId: review._id, productId: variantExists.productId,
        variantId, userId: user._id, rating,comment,sku: variantExists.sku,
      });
    }
    return review
  }

  async findAll(query : AllReviewsDTO):Promise<IPagination<IReview>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , search} = query || {};
    const reviews = await this.reviewRepository.paginate({
      filter : {...(search && {variantSnapshot :  new RegExp(search , 'i')} )}
      , page , limit , sort})
    return reviews
  }

  async findOne(reviewId: Types.ObjectId) : Promise<IReview> {
    const review = await this.reviewRepository.findOne({filter : {_id : reviewId} , options : {populate : [{path : "createdBy" , select : "firstName lastName profileImage"}]}})
    if(!review) throw new NotFoundException(`This review ${reviewId.toString()} not found`)
    return review
  }

  async approve(reviewId: Types.ObjectId , user : HUserDocument ) : Promise<string> {
    const review = await this.reviewRepository.findOneAndUpdate({filter : {_id : reviewId , isApproved : false} , update : {isApproved : true , updatedBy : user._id} , options : {populate : [{path : "variantId" , select : "sku"}]}})
    if(!review) throw new NotFoundException(`This review ${reviewId.toString()} not found`)
    const variant = review.variantId as IProductVariant;
      this.eventEmitter.emit('review.approved', {
      reviewId: review._id, userId: user._id,sku: variant.sku,
    });
    return `Review approved successfuly by ${user.firstName} ${user.lastName}`
  }

  async reject(reviewId: Types.ObjectId , user : HUserDocument , {reason} : RejectReviewDTO) : Promise<string> {
    const review = await this.reviewRepository.findOneAndUpdate({filter : {_id : reviewId , isApproved : false} , update : {isRejected : true , rejectReson : reason , rejectedAt : new Date() , updatedBy : user._id}})
    if(!review) throw new NotFoundException(`This review ${reviewId.toString()} not found`)
    const variant = review.variantId as IProductVariant;
    this.eventEmitter.emit('review.rejected', {
      reviewId: review._id, userId: user._id,sku: variant.sku,reason
    })
    return `Review rejected successfuly by ${user.firstName} ${user.lastName}`
  }

  async update(reviewId: Types.ObjectId, {rating , comment}: UpdateReviewDto , user : HUserDocument) : Promise<IReview> {
    const existingReview = await this.reviewRepository.findOne({filter: { _id: reviewId, createdBy: user._id }});
    if (!existingReview) {
      throw new NotFoundException(`Review with ID ${reviewId.toString()} not found`);
    }
    let isApproved = existingReview.isApproved;
    if (comment !== undefined) {
      const isBad = this.filter.isProfane(comment);
      isApproved = isBad ? false : true
    }
    const updatedReview = await this.reviewRepository.findOneAndUpdate({filter: { _id: reviewId, createdBy: user._id },
      update: {$set: {...(rating !== undefined && { rating }),...(comment !== undefined && { comment }),isApproved , updatedBy : user._id}},
    });
    if(!updatedReview) throw new NotFoundException(`Fail to update your rating`)
    this.eventEmitter.emit('review.create', {
      productId: existingReview.productId,
      variantId: existingReview.variantId,
    });
    return updatedReview;
  }

  async remove(reviewId: Types.ObjectId , user : HUserDocument) : Promise<string> {
    const review = await this.reviewRepository.findOneAndDelete({filter : {createdBy : user._id , _id : reviewId} , options : {returnDocument : "before"}})
    if(!review) throw new NotFoundException(`This review ${reviewId.toString()} not found`)
    if (review.isApproved === true) {
      this.eventEmitter.emit('review.create', {
        productId: review.productId,
        variantId: review.variantId,
      });
    }
    return `Review deleted successful`
  }

}
