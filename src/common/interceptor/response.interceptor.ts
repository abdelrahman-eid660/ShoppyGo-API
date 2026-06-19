
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonCodeResponse } from '../enum/common.enum';

export interface Response<T> {
  data: T;
  success : boolean
  code : string,
  statusCode : number
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();
    const success = response.statusCode < 400;
    return next.handle().pipe(map(data => ({success, statusCode: response.statusCode, code: data?.code ?? CommonCodeResponse.success,  data : data?.data ?? data ??  null, })))
    }
}
// export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
//   intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
//     const args = context.getArgs() as unknown as Response<T>
//     return next.handle().pipe(map(data => ({ data , statusCode : args.statusCode , code : args.code , success : args.success })));
//   }
// }
