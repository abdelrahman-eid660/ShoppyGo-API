import { Controller, Get, Param, Delete, Patch, UploadedFile, ParseFilePipe, UseInterceptors, UseGuards, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { Auth, User } from 'src/common/decorator';
import { RoleEnum } from 'src/common/enum';
import type { HUserDocument } from 'src/DB/models';
import type { IFile, IUser } from 'src/common/interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudMulter, fieldValidation, localMulter } from 'src/common/utils/multer';
import { AuthenticationGuard } from 'src/common/guard';
import { UsersAccessDTO } from './dto/';
@UseGuards(AuthenticationGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  // @Post()
  // create(@Body() createUserDto: CreateUserDto) {
  //   return this.userService.create(createUserDto);
  // }

  @Get('all-users')
  findAll() {
    return this.userService.findAll();
  }
  
  @Auth({
    roles: [
      RoleEnum.ADMIN,
      RoleEnum.USER,
      RoleEnum.SUPERADMIN,
      RoleEnum.SUPERVISOR,
    ],
  })
  @Get('profile')
  profile(@User() user: HUserDocument) : IUser  {
    return  user
  }

  @UseInterceptors(FileInterceptor("profile-image" , CloudMulter({validation : fieldValidation.image})))
  @Patch("profile-image")
  async profileImage(
    @UploadedFile(new ParseFilePipe({fileIsRequired : true}))
    file  : IFile,
    @User() user : HUserDocument,
  ) : Promise<IUser>{
    console.log({file});
    console.log({user});
    return await this.userService.profileImage(user , file)
  }
  // @UseInterceptors(FileInterceptor("profile-image" , CloudMulter({validation : fieldValidation.image , storageApproach : StorageApproachEnum.MEMORY})))
  // @Patch("profile-image")
  // profileImage(
  //   @UploadedFile(new ParseFilePipe({fileIsRequired : true}))
  //   file  : IFile,
  //   @Req() req : Request,
  //   @User() user : HUserDocument,
  // ){
  //   return file
  // }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }
  @Auth({roles : [RoleEnum.SUPERADMIN]})
  @Patch('/:userId/access')
  async usersAccess(@Param('userId') userId: string, @Body() body: UsersAccessDTO , @User() user : HUserDocument) {
    return await this.userService.usersAccess(userId, body , user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
  
}
