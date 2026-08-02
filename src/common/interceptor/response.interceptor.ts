import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonCodeResponse } from '../enum/common.enum';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface Response<T> {
  data: T;
  success: boolean;
  code: string;
  statusCode: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T>> {
    const type = context.getType<'http' | 'ws' | 'graphql'>()
    let statusCode : number = 200
    return next
      .handle()
      .pipe(
        map(data => {
          let result = data
          switch (type) {
            case 'http':
              statusCode = context.switchToHttp().getResponse().statusCode;
              result = {
              success : statusCode < 400,
              statusCode,
              code: data?.code ?? CommonCodeResponse.success,
              data: data?.data ?? data ?? null,
              }
              break;
          }
          return result
        })
      )
  }
}