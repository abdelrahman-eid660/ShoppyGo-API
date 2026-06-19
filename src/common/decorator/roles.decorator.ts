import { SetMetadata } from '@nestjs/common';
import { PermissionEnum, RoleEnum } from '../enum';

export const RoleName = 'roles';
export const RolesDecorator = (...roles: RoleEnum[]) => {
  return SetMetadata(RoleName, roles);
};
export const PermissionName = 'Permissions';
export const PermissionsDecorator = (...Permissions: PermissionEnum[]) => {
  return SetMetadata(PermissionName, Permissions);
};
