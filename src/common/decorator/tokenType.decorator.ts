import { SetMetadata } from '@nestjs/common';
import { TokenTypeEnum } from '../enum';
export const tokenTypeName = 'tokenType';
export const TokenTypeDecorator = (
  tokenType: TokenTypeEnum = TokenTypeEnum.ACCESS
) => {
  return SetMetadata(tokenTypeName, tokenType);
};
