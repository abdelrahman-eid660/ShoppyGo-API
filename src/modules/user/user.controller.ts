import { Controller, Get, Param, Delete, Patch, UploadedFile, ParseFilePipe, UseInterceptors, UseGuards, Body, Post, Req, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { Auth, PermissionsDecorator, Profile, TokenTypeDecorator, User } from 'src/common/decorator';
import { PermissionEnum, RoleEnum, StorageApproachEnum, TokenTypeEnum } from 'src/common/enum';
import type { HUserDocument } from 'src/DB/models';
import type { IFile, IUser } from 'src/common/interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudMulter, fieldValidation } from 'src/common/utils/multer';
import { AuthenticationGuard } from 'src/common/guard';
import { LogoutDTO, updateUserDTO, UsersAccessDTO } from './dto/';
import { ProfileCacheInterceptor } from 'src/common/interceptor';
import { ObjectIdPipe } from 'src/common/pipe';
import { Types } from 'mongoose';
import type{ Request, Response } from 'express';
@UseGuards(AuthenticationGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  @UseGuards(AuthenticationGuard)
  @Profile(true)
  @UseInterceptors(ProfileCacheInterceptor)
  @Get('profile')
  profile(@User() user: HUserDocument) : HUserDocument  {
    return  user
  }

  @UseInterceptors(FileInterceptor("profile-image" , CloudMulter({validation : fieldValidation.image , storageApproach : StorageApproachEnum.DISK})))
  @PermissionsDecorator(PermissionEnum.ACCOUNT_UPDATE_SELF)
  @Patch("profile-image")
  async profileImage(@UploadedFile(new ParseFilePipe({fileIsRequired : true}))file  : IFile,@User() user : HUserDocument) : Promise<IUser>{
    return await this.userService.profileImage(user , file)
  }

  @PermissionsDecorator(PermissionEnum.ACCOUNT_UPDATE_SELF)
  @Patch(':userId/update')
  async updateUser(@Param('userId' , ObjectIdPipe) userId: Types.ObjectId , @Body() data : updateUserDTO) {
    return await this.userService.updateUser(userId , data );
  }

  @Get('rotate')
  @TokenTypeDecorator(TokenTypeEnum.REFREASH)
  async rotate(@User() user : HUserDocument , @Req() req : Request , @Res() res : Response) {
    const tokens = await this.userService.rotateToken( user,`${req.protocol}://${req.get('host')}`,req.decode);
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true, sameSite: 'lax', secure: true,maxAge: 1000 * 60 * 15,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true, sameSite: 'lax',secure: true, maxAge: 1000 * 60 * 60 * 24 * 30 * 12,
    });
    return {
      message: 'Access token rotated successfully',
    };
  }

  @Post('logout')
  async logout(@User() user : HUserDocument, @Body() data : LogoutDTO , @Req() req : Request , @Res() res : Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return await this.userService.logout(data , user , req.decode );
  }

  @Auth({roles : [RoleEnum.SUPERADMIN]})
  @Patch('/:userId/access')
  async usersAccess(@Param('userId') userId: Types.ObjectId, @Body() body: UsersAccessDTO , @User() user : HUserDocument) {
    return await this.userService.usersAccess(userId, body , user);
  }

  @PermissionsDecorator(PermissionEnum.ACCOUNT_DELETE_SELF)
  @Delete(':userId')
  async deleteAccount(@Param('userId' , ObjectIdPipe) userId: Types.ObjectId) {
    return await this.userService.deleteAccount(userId);
  }
  
}
