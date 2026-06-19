import { RedisActionsEnum } from '../enum';

export type RedisKeyParams = {
  type?: string;
  key?: string;
  action?: (typeof RedisActionsEnum)[keyof typeof RedisActionsEnum] | undefined;
  blockAction?:
    | (typeof RedisActionsEnum)[keyof typeof RedisActionsEnum]
    | undefined;
};

export type SetParams<T = any> = {
  key: string;
  value: T;
  ttl?: number;
  parse?: boolean;
};

export type GetParams = {
  key: string;
  parse?: boolean;
};
export enum viewRedisEnum {
  STORY = 'story',
  VIEW = 'view',
}
