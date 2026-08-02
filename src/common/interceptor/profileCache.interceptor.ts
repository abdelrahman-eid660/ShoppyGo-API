import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, of, tap } from "rxjs";
import { CacheService } from "../service";
import { GqlExecutionContext } from "@nestjs/graphql";
import { IAuthReq } from "../interface";
import { Reflector } from "@nestjs/core";
import { profileName, ttlName } from "../decorator";

@Injectable()
export class ProfileCacheInterceptor implements NestInterceptor {
    constructor(private readonly redis : CacheService , private readonly reflector : Reflector){}
     async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const ttl : number = this.reflector.getAllAndOverride<number>(ttlName , [context.getHandler() , context.getClass()]) ?? 300
        const profile : boolean = this.reflector.getAllAndOverride<boolean>(profileName , [context.getHandler() , context.getClass()]) ?? false
        let req : IAuthReq;
        let userId : string;
        switch (context.getType<'http' | 'graphql' | 'ws'>()) {
            case 'ws':
                req = context.switchToWs().getClient()
                userId = req.user._id.toString()
                break;
            case 'graphql':
                // eslint-disable-next-line no-case-declarations
                const graphqlContext = GqlExecutionContext.create(context)
                req = graphqlContext.getContext().req
                userId = req.user._id.toString()
                break;
            default:
                req = context.switchToHttp().getRequest() 
                userId = req.user._id.toString()
                break;
            }
        const cacheKey =  this.redis.ProfileCacheKey(userId)
        if (profile) {
         const data = await this.redis.get({key : cacheKey})
            if (data) {
                return of(JSON.parse(data))
            }            
        }

        return next.handle().pipe(tap(
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            async(value)=>{
                await this.redis.set({key : cacheKey , value , ttl , parse : true})
        }));
    }
    
}