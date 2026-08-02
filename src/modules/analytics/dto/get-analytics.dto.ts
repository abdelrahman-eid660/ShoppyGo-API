import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

@ArgsType()
export class GetAnalyticsDTO {
  @Field(() => Int , {nullable : true})
  @IsNumber()
  @IsOptional()
  sortType?: number;
  @Field(() => Int , {nullable : true})
  @IsNumber()
  @IsOptional()
  @IsPositive()
  limit?: number;
}

@ArgsType()
export class GetZeroAnalyticsDTO {
  @Field(() => Int , {nullable : true})
  @IsNumber()
  @IsOptional()
  @IsPositive()
  limit?: number;
}
