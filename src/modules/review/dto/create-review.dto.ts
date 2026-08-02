import { IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { Types } from "mongoose";
import { IsBadWord } from "src/common/decorator";
import { IReview } from "src/common/interface";

export class CreateReviewDto implements Partial<IReview> {
    @MinLength(2)
    @MaxLength(500)
    @IsString()
    @IsOptional()
    @IsBadWord()
    comment?: string;
    @IsInt()
    @Min(1)
    @Max(5)
    rating!: number;
    @IsMongoId()
    variantId!: Types.ObjectId;
}
