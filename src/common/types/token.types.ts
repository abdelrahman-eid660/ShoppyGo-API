import { Secret, SignOptions } from 'jsonwebtoken';

export type GenerateTokenParams = {
  payload?: object;
  secret?: string;
  options?: SignOptions;
};
export type VerifyTokenParams = {
  token: string;
  secret?: string;
};
export type TokenSignature = {
  accessSignature: string;
  refreashSignature: string;
  audience: string;
};
