import { RoleEnum, RolePermissions } from "../enum";

export function Permissions(role: RoleEnum) {
  return RolePermissions[role];
}