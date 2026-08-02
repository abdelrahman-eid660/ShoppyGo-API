/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-case-declarations */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { CacheService } from "../service";
import { Observable, of, tap } from "rxjs";
import { IAuthReq } from "../interface";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class CartCacheInterceptor implements NestInterceptor {
    constructor(private readonly redis : CacheService){}
    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        let req : IAuthReq;
        let userId : string
        switch (context.getType<'http' | 'graphql' | 'ws'>()) {
            case 'ws':
                req = context.switchToWs().getClient()
                userId = req.user._id.toString()
                break;
            case 'graphql':
                const graphqlContext = GqlExecutionContext.create(context)
                req = graphqlContext.getContext().req
                userId = req.user._id.toString()
                break;
            default:
                req = context.switchToHttp().getRequest()
                userId = req.user._id.toString()            
                break;
        }
        const cacheKey = this.redis.cartCacheKey(userId)
        const data = await this.redis.get({key : cacheKey , parse : true})
        if (data) {
            return of(data)
        }
        return next.handle().pipe(tap(
            async(value)=>{
                await this.redis.set({key : cacheKey , value , ttl : 0 , parse : true})
            }
        ))
    }
}