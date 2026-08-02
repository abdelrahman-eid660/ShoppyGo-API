/* eslint-disable @typescript-eslint/no-misused-promises */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, of, tap } from "rxjs";
import { CacheService } from "../service";
import { GqlExecutionContext } from "@nestjs/graphql";
import { Reflector } from "@nestjs/core";
import { CacheKeyName, parseName, ttlName } from "../decorator";
import { IS_PUBLIC_KEY } from "../decorator/public.decorator";

@Injectable()
export class CustomeCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly redis: CacheService,
    private readonly reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const ttl: number = this.reflector.getAllAndOverride<number>(ttlName, [context.getHandler(), context.getClass()]) ?? 86400;
    const parse: boolean = this.reflector.getAllAndOverride<boolean>(parseName, [context.getHandler(), context.getClass()]) ?? true;
    const cacheValue = this.reflector.getAllAndOverride<string>(CacheKeyName, [context.getClass(), context.getHandler()]);
    const isPublicDecorator = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(),context.getClass()]);
    if (!cacheValue) return next.handle();

    let userId: string = 'GUEST';
    let extraKey: string | undefined;

    switch (context.getType<'http' | 'graphql' | 'ws'>()) {
      case 'graphql': {
        const graphqlContext = GqlExecutionContext.create(context);
        const gqlCtx = graphqlContext.getContext();
        const args = graphqlContext.getArgs();
        userId = gqlCtx?.req?.user?._id?.toString() ?? 'GUEST';
        extraKey = args?.productId || args?.productVariantId || args?.orderId || args.brandId || args.categoryId;
        if (!extraKey && Object.keys(args).length > 0) {
          extraKey = new URLSearchParams(args as Record<string, string>).toString();
        }
        break;
      }

      case 'ws': {
        const client = context.switchToWs().getClient();
        const wsData = context.switchToWs().getData();
        userId = client?.user?._id?.toString() ?? 'GUEST';
        extraKey = wsData?.productId || wsData?.productVariantId || wsData?.orderId || wsData.brandId || wsData.categoryId;
        break;
      }

      default: {
        const req = context.switchToHttp().getRequest();
        userId = req?.user?._id?.toString() ?? 'GUEST';
        const params = req.params || {};
        const query = req.query || {};
        extraKey = params.productId || params.productVariantId || params.orderId || params.brandId || params.categoryId;
        if (!extraKey && Object.keys(query).length > 0) {
          extraKey = new URLSearchParams(query as Record<string, string>).toString();
        }
        break;
      }
    }

    const isPublicCache = isPublicDecorator || 
      cacheValue.includes('PRODUCT') || cacheValue.includes('PRODUCT_VARIANT') || 
      cacheValue.includes('CATEGORY') || cacheValue.includes('BRAND') || 
      cacheValue.includes('GET_PRDOCUTS_BY_BRAND') || cacheValue.includes('GET_PRDOCUTS_BY_CATEGORY') || userId === 'GUEST';
    
    const userPrefix = isPublicCache ? 'PUBLIC' : `USER::${userId}`;
    const cacheKey = extraKey ? `${userPrefix}::${cacheValue}::${extraKey}` : `${userPrefix}::${cacheValue}` ;
    const data = await this.redis.get({ key: cacheKey, parse });
    if (data) {
      return of(data);
    }

    return next.handle().pipe(
      tap(async (value) => {
        if (value) {
          await this.redis.set({ key: cacheKey, value, ttl, parse });
        }
      })
    );
  }
}