import { applyDecorators, UseGuards } from '@nestjs/common';
import { TokenTypeDecorator } from './tokenType.decorator';
import { PermissionEnum, RoleEnum, RolePermissions, TokenTypeEnum } from '../enum';
import { PermissionsDecorator, RolesDecorator } from './roles.decorator';
import { AuthenticationGuard, AuthorizationGuard } from '../guard';

export const Auth = ({
  tokenType = TokenTypeEnum.ACCESS,
  roles = [RoleEnum.USER],
}: {
  tokenType?: TokenTypeEnum;
  roles?: RoleEnum[];
}) => {
  return applyDecorators(
    TokenTypeDecorator(tokenType),
    RolesDecorator(...roles),
    UseGuards(AuthenticationGuard, AuthorizationGuard)
  );
};
