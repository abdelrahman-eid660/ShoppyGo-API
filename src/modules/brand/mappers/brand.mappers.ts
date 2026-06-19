import { Injectable } from '@nestjs/common';
import { RoleEnum } from 'src/common/enum';
import { AdminBrandResponse, PublicBrandResponse } from 'src/common/interface';
import { HUserDocument } from 'src/DB/models';
@Injectable()
export class BrandMapper {
  constructor(){}
   toResponse(brand: any, user?: HUserDocument): PublicBrandResponse | AdminBrandResponse {
    const base = {
      id: brand._id.toString(),
      name: brand.name,
      logo: brand.logo,
    };

    // لو مفيش user → public response
    if (!user) return base;

    const isAdmin =
      user.role === RoleEnum.ADMIN ||
      user.role === RoleEnum.SUPERADMIN;

    // user عادي
    if (!isAdmin) return base;

    // admin/superadmin
    return {
      ...base,
      // بيانات إضافية للإدارة فقط
      createdBy: brand.createdBy,
      updatedBy: brand.updatedBy,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };
  }
}