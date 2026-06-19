import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { IAuthReq } from '../interface';
import { GqlExecutionContext } from '@nestjs/graphql';
import { LanguageEnum } from '../enum';

@Injectable()
export class LanguageIntercaptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>
  ): Observable<any> {
    let req : IAuthReq;
    switch (context.getType<'http' | 'graphql' | 'ws'>()) {
      case 'ws':
        req = context.switchToWs().getClient()
        req.headers['accept-language'] ??= req?.user?.lang ?? LanguageEnum.EN
        break;
      case 'graphql':
        // eslint-disable-next-line no-case-declarations
        const graphqlContext = GqlExecutionContext.create(context)
        req = graphqlContext.getContext().req
        req.headers['accept-language'] ??= req?.user?.lang ?? LanguageEnum.EN
        break;
      default:
        req = context.switchToHttp().getRequest() 
        req.headers['accept-language'] ??= req?.user?.lang ?? LanguageEnum.EN
        break;
    }
    return next.handle().pipe();
  }
}
