import { applyDecorators, UseGuards } from '@nestjs/common';
import { TokenTypeDecorator } from './tokenType.decorator';
import { PermissionEnum, RoleEnum, RolePermissions, TokenTypeEnum } from '../enum';
import { PermissionsDecorator, RolesDecorator } from './roles.decorator';
import { AuthenticationGuard, AuthorizationGuard } from '../guard';
import { Public } from './public.decorator';

export const Auth = ({
  tokenType = TokenTypeEnum.ACCESS,
  roles = Object.values(RoleEnum),
  isPublic = false
}: {
  tokenType?: TokenTypeEnum;
  roles?: RoleEnum[],
  isPublic? : boolean
}) => {
  const decorators = [
    TokenTypeDecorator(tokenType),
    RolesDecorator(...roles),
    UseGuards(AuthenticationGuard, AuthorizationGuard)
  ]
  if (isPublic) {
    decorators.push(Public())
  }
  return applyDecorators(...decorators);
};
