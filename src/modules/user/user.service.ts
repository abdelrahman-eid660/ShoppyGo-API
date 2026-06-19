import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/DB/Repository';
import { HUserDocument } from 'src/DB/models';
import { IFile, IUser } from 'src/common/interface';
import { S3Service, TranslationService } from 'src/common/service';
import { UsersAccessDTO } from './dto';
import { TransformToObjectId } from 'src/common/utils/ObjectId';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository , private readonly translationService : TranslationService , private readonly s3 : S3Service) {}
  async profile(user: HUserDocument) {
    return user
  }
  async profileImage(user : HUserDocument  , file: IFile) : Promise<IUser> {
    const oldImage = user.profileImage
    user.profileImage = await this.s3.uploadAsset({file , path : `Users/${user._id.toString()}/profile/profileImage`})
    await user.save()
    try {
      void this.s3.deleteAsset({Key : oldImage as string})
    } catch (error) {
      throw new BadRequestException("Fail to delete asset from s3")
    }
    return user;
  }
  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async usersAccess(userId: string , {role , permissions} : UsersAccessDTO , user : HUserDocument):Promise<IUser> {
    const _id =  TransformToObjectId(userId)
    const userExist = await this.userRepository.findOneAndUpdate({filter : {_id} , update : {role , permissions , updatedBy : user._id} , options:{new : true}})
    if (!userExist) {
      throw new NotFoundException("User not found")
    }
    return userExist
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
