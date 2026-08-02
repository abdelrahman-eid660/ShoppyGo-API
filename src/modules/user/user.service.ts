/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository, StockAlertRepository, UserRepository, WishlistRepository } from 'src/DB/Repository';
import { HUserDocument } from 'src/DB/models';
import { IFile, IGenerateToken, IUser } from 'src/common/interface';
import { CacheService, S3Service, TokenService, TranslationService } from 'src/common/service';
import { LogoutDTO, UpdatePasswordDTO, updateUserDTO, UsersAccessDTO } from './dto';
import { Types } from 'mongoose';
import { DatabaseService } from 'src/DB/service/database.service';
import { CacheKeyEnum, LogoutEnum } from 'src/common/enum';
import { SecurityService } from 'src/common/service/security';
import { JwtPayload } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class UserService {
  ACCESS_EXPIRES_IN! : string
  constructor(private readonly userRepository: UserRepository ,
    private readonly translationService : TranslationService , 
    private readonly s3 : S3Service,
    private readonly redis : CacheService,
    private readonly databaseService : DatabaseService,
    private readonly cartRepository : CartRepository,
    private readonly wishlistRepository : WishlistRepository,
    private readonly stockAlertRepository : StockAlertRepository,
    private readonly securityService : SecurityService,
    private readonly tokenService : TokenService,
    private readonly configService : ConfigService,
  ) {
    this.ACCESS_EXPIRES_IN = this.configService.get<string>('ACCESS_EXPIRES_IN')!
  }

  async profileImage(user : HUserDocument  , file: IFile) : Promise<IUser> {
    const oldImage = user.profileImage
    const uuid = randomUUID()
    user.profileImage = await this.s3.uploadAsset({file , path : `Users/profileImageظ${user._id.toString()}/${uuid}-${file.originalname}`})
    await user.save()
    try {
      void this.s3.deleteAsset({Key : oldImage as string})
    } catch (error) {
      throw new BadRequestException("Fail to delete asset from s3")
    }
    const key = this.redis.ProfileCacheKey(user._id)
    await this.redis.deleteKey(key)
    return user;
  }

  async updatePassword(data: UpdatePasswordDTO,user: HUserDocument): Promise<string> {
    const { oldPassword, newPassword } = data;
    if (!(await this.securityService.compareHash(oldPassword, user.password))) {
      throw new NotFoundException("Invalid Password");
    }
    user.password = newPassword;
    await user.save();
    const key = this.redis.ProfileCacheKey(user._id)
    await this.redis.deleteKey(key)
    return "Update Password successfuly";
  }

  async rotateToken(user: HUserDocument , issure: string, decodedToken: JwtPayload): Promise<IGenerateToken> {
    await this.redis.sAdd(this.redis.RevokeTokenKey(String(user._id)),String(decodedToken.jti));
    const now = Math.floor(Date.now() / 1000);
    const ttl = (decodedToken.exp as number) - now;
    if (now < (decodedToken.iat as number) + Number(this.ACCESS_EXPIRES_IN)) {
      throw new ConflictException("Current access session still valid");
    }
    await this.redis.expire(this.redis.RevokeTokenKey(String(user._id)), ttl);
    return await this.tokenService.createLoginCredentials(user, issure);
  }

  async logout({ flag }: LogoutDTO,user: HUserDocument, decodedToken: JwtPayload): Promise<number> {
    let status = 200;
    const now = Math.floor(Date.now() / 1000);
    const tokenExp = decodedToken.exp ? Number(decodedToken.exp) : 0;
    const ttl = tokenExp - now;
    switch (flag) {
      case LogoutEnum.ALL:
        user.changeCredentialsTime = new Date();
        await user.save();
        await this.redis.set({key: this.redis.RevokeAllTokenKey(String(user._id)),value: now,});
        break;

      default:
        if (ttl > 0) {
          const tokenKey = this.redis.RevokeSingleTokenKey(user._id.toString(),String(decodedToken.jti));
          await this.redis.set({key: tokenKey,value: "revoked",ttl: ttl});
        }
        status = 201;
        break;
    }
    return status;
  }

  async updateUser(userId: Types.ObjectId , {DOB ,  address , firstName , gender , lastName , phone} : updateUserDTO) {
    const update : Partial<HUserDocument> = {updatedBy : userId}
    if (DOB !== undefined) update.DOB = DOB
    if (address !== undefined) update.address = address
    if (firstName !== undefined) update.firstName = firstName
    if (lastName !== undefined) update.lastName = lastName
    if (gender !== undefined) update.gender = gender
    if (phone !== undefined) update.phone = phone
    const user = await this.userRepository.findOneAndUpdate({filter : {_id : userId} , update : {$set : update}})
    if(!user) throw new BadRequestException(`Fail to update your account`)
    const key = this.redis.ProfileCacheKey(user._id)
    await this.redis.deleteKey(key)
    return user
  }

  async usersAccess(userId: Types.ObjectId , {role , permissions} : UsersAccessDTO , user : HUserDocument):Promise<IUser> {
    const userExist = await this.userRepository.findOneAndUpdate({filter : {_id : userId} , update : {role , permissions , updatedBy : user._id} , options:{new : true}})
    if (!userExist) {
      throw new NotFoundException("User not found")
    }
    const key = this.redis.ProfileCacheKey(user._id)
    await this.redis.deleteKey(key)
    return userExist
  }

  async deleteAccount(userId: Types.ObjectId) : Promise<string> {
    const anonymizedEmail = `deleted_${userId.toString()}_${Date.now()}@anonymized.local`;
    const [account , cart , wishlist , stockAlert] = await Promise.all([
      this.userRepository.findOneAndUpdate({filter : {_id : userId , deletedAt : {$exists : false}} ,
        update : { $set: { email: anonymizedEmail, firstName: 'Deleted', lastName: 'User',phone: null,
        password: 'DELETED_ACCOUNT_NO_PASSWORD',deletedAt: new Date()}}
      }),
      this.cartRepository.findOneAndDelete({filter : {createdBy : userId}}),
      this.wishlistRepository.findOneAndDelete({filter : {createdBy : userId}}),
      this.stockAlertRepository.findOneAndDelete({filter : {createdBy : userId}}),
    ])
    if(!account || account.deletedAt) throw new NotFoundException(`User not exists or already deleted`)
    if(cart) await this.redis.clearCacheKey({key : CacheKeyEnum.CART , userId})
    if(wishlist) await this.redis.clearCacheKey({key : CacheKeyEnum.WISHLIST , userId})
    const key = this.redis.ProfileCacheKey(userId)
    await this.redis.deleteKey(key)
    return `Account deleted and personal data anonymized successfully.`
  }
}
