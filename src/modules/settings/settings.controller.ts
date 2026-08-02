import { Controller, Body, Patch, Get, UseInterceptors } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Auth, CacheKey, PermissionsDecorator, User } from 'src/common/decorator';
import type{ HUserDocument } from 'src/DB/models';
import { CacheKeyEnum, PermissionEnum, RoleEnum } from 'src/common/enum';
import { AddSubCurrencyDTO, ChangeBaseCurrencyDTO, ChangeLogoDTO, ChangeProjectNameDTO, ChangeReturnPolicyDaysDTO, RemoveSubCurrencyDTO } from './dto';
import { CustomeCacheInterceptor } from 'src/common/interceptor';
import { ISettings } from 'src/common/interface';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Auth({roles : [RoleEnum.SUPERADMIN , RoleEnum.ADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.SETTINGS_UPDATE)
  @CacheKey(CacheKeyEnum.SETTINGS)
  @UseInterceptors(CustomeCacheInterceptor)
  @Get('get-settings')
  async findOne(): Promise<ISettings> {
    return await this.settingsService.findOne();
  }

  @Auth({roles : [RoleEnum.SUPERADMIN , RoleEnum.ADMIN]})
  @PermissionsDecorator(PermissionEnum.SETTINGS_UPDATE)
  @Patch('change-project-name')
  async changeProjectName(@Body() data : ChangeProjectNameDTO , @User() user :HUserDocument): Promise<ISettings> {
    return await this.settingsService.changeProjectName(data , user);
  }

  @Auth({roles : [RoleEnum.SUPERADMIN , RoleEnum.ADMIN]})
  @PermissionsDecorator(PermissionEnum.SETTINGS_UPDATE)
  @Patch('change-logo')
  async changeLogo(@Body() data : ChangeLogoDTO , @User() user :HUserDocument): Promise<ISettings> {
    return await this.settingsService.changeLogo(data , user);
  }

  @Auth({roles : [RoleEnum.SUPERADMIN , RoleEnum.ADMIN]})
  @PermissionsDecorator(PermissionEnum.SETTINGS_UPDATE)
  @Patch('change-return-policy-days')
  async changeReturnPolicyDays(@Body() data : ChangeReturnPolicyDaysDTO , @User() user :HUserDocument): Promise<ISettings> {
    return await this.settingsService.changeReturnPolicyDays(data , user);
  }

  @Auth({roles : [RoleEnum.SUPERADMIN , RoleEnum.ADMIN]})
  @PermissionsDecorator(PermissionEnum.SETTINGS_UPDATE)
  @Patch('change-base-currency')
  async changeBaseCurrency(@Body() data : ChangeBaseCurrencyDTO , @User() user :HUserDocument): Promise<ISettings> {
    return await this.settingsService.changeBaseCurrency(data , user);
  }

  @Auth({roles : [RoleEnum.SUPERADMIN , RoleEnum.ADMIN]})
  @PermissionsDecorator(PermissionEnum.SETTINGS_UPDATE)
  @Patch('add-sub-currency')
  async addSubCurrency(@Body() data : AddSubCurrencyDTO , @User() user :HUserDocument): Promise<ISettings> {
    return await this.settingsService.addSubCurrency(data , user);
  }

  @Auth({roles : [RoleEnum.SUPERADMIN , RoleEnum.ADMIN]})
  @PermissionsDecorator(PermissionEnum.SETTINGS_UPDATE)
  @Patch('remove-sub-currency')
  async removeCurrency(@Body() data : RemoveSubCurrencyDTO , @User() user :HUserDocument): Promise<ISettings> {
    return await this.settingsService.removeCurrency(data , user);
  }

}
