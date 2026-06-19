/* eslint-disable no-case-declarations */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { HUserDocument } from 'src/DB/models';

export const User = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    let user!: HUserDocument;
    const type = context.getType<'http' | 'ws' | 'graphql'>();
    switch (type) {
      case 'ws':
        user = context.switchToWs().getClient().user;
        break;
      case 'graphql':
        const gqlContext = GqlExecutionContext.create(context);
        user = gqlContext.getContext().user;
        break;
      default:
      case 'http':
        user = context.switchToHttp().getRequest().user;
        break;
    }
    return user;
  }
);
