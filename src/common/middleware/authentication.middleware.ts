import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  use() {}
}
