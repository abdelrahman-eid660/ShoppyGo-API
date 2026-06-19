import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class UsersDTO {
  @IsOptional()
  @IsMongoId()
  userId?: string;
}
