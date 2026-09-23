import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    // 1. التحقق إذا كان الطلب قادماً من GraphQL
    if (context.getType<string>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context).getContext();
      // يُفترض أن كائن الـ req مفعل داخل الـ context للـ GraphQL
      return { req: gqlCtx.req, res: gqlCtx.res };
    }

    // 2. إذا كان الطلب HTTP عادي
    return super.getRequestResponse(context);
  }
}