import { ReviewRepository } from './../../DB/Repository/review.repository';
import { ProductRepository, ProductVariantRepository } from 'src/DB/Repository';
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from '@nestjs/event-emitter';
import { IReview } from '../interface';
import { Types } from 'mongoose';

@Injectable()
export class ReviewsListener {
    private readonly logger = new Logger()
    constructor(
        private readonly productRepository : ProductRepository,
        private readonly productVariantRepository : ProductVariantRepository,
        private readonly reviewRepository : ReviewRepository,
    ){}
    @OnEvent('review.create' , {async : true})
    async handelReviewEvent({productId , variantId} : Partial<IReview>){
        try {
            const [productStats] = await this.reviewRepository.aggregate([
                {$match : {productId  , isApproved : true}},
                {
                    $group : {
                        _id : "$productId",
                        totalCount : {$sum : 1},
                        avgRating : {$avg : '$rating'}
                    }
                }
            ])
            await this.productRepository.findOneAndUpdate({filter : {_id : productId , isPublished : true} , update : {
                reviewCount: productStats ? productStats.totalCount : 0, 
                rating: productStats ? Number(productStats.avgRating.toFixed(1)) : 0}})
            if (variantId) {
                const [variantStats] = await this.reviewRepository.aggregate([
                    {$match : {variantId , isApproved : true}},
                    {
                        $group : {
                            _id : "$variantId",
                            totalCount : {$sum : 1},
                            avgRating : {$avg : '$rating'}
                        }
                    }
                ])
                await this.productVariantRepository.findOneAndUpdate({filter : {_id : variantId as Types.ObjectId , isPublished : true} , update : {
                    reviewCount: variantStats ? variantStats.totalCount : 0, 
                    rating: variantStats ? Number(variantStats.avgRating.toFixed(1)) : 0}})
            }
        } catch (error) {
            this.logger.error(`Error recalculating ratings for product ${productId?.toString()}:`, error);
            throw new BadRequestException(error)
        }
    }
}