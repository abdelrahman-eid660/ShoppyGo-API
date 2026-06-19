/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType, RedisDefaultModules } from 'redis';
import { Types } from 'mongoose';
import { RedisActionsEnum, RedisTypeEnum } from '../../enum';
import {
  GetParams,
  RedisKeyParams,
  SetParams,
  viewRedisEnum,
} from '../../types';
import { RedisClientMultiCommandTyped } from '@redis/client/dist/lib/client/multi-command';
@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly client: RedisClientType
  ) {
    this.handleEvents();
  }
  private handleEvents() {
    this.client.on('connect', () => {
      console.log(`Redis connected Successfuly ❤️🌞`);
    });
    this.client.on('error', (error) => {
      console.log(`Fail to Connect Redis ❌ ${error}`);
    });
  }
  //======================== Set ==========================
  async set<T>({
    key,
    value,
    ttl,
    parse = false,
  }: SetParams<T>): Promise<string | null> {
    const Value = parse ? JSON.stringify(value) : (value as any);

    if (ttl) {
      return await this.client.set(key, Value, { EX: ttl });
    }

    return await this.client.set(key, Value);
  }

  //======================== Get ==========================
  async get<T = any>({
    key,
    parse = false,
  }: GetParams): Promise<T | string | null> {
    const data = await this.client.get(key);

    if (!data) return null;

    return parse ? (JSON.parse(data) as T) : data;
  }

  //======================== Delete =======================
  async deleteKey(key: string | string[]): Promise<number> {
    if (!key) return 0;
    return await this.client.del(key);
  }

  //======================== Exists =======================
  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  //======================== Expire =======================
  async expire(key: string, ttl: number): Promise<number> {
    return await this.client.expire(key, ttl);
  }

  //======================== TTL ==========================
  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  //======================== Incr =========================
  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  //======================== mGet =========================
  async mGet(keys: string[]): Promise<(string | null)[]> {
    if (!keys.length) return [];
    return await this.client.mGet(keys);
  }

  //======================== Keys =========================
  async keys(prefix: string): Promise<string[]> {
    return await this.client.keys(`${prefix}*`);
  }
  //======================== SADD =========================
  async sAdd(key: string, value: string): Promise<number> {
    return await this.client.sAdd(key, value);
  }
  //======================== SCARD =========================
  async sCard(key: string): Promise<number> {
    return await this.client.sCard(key);
  }
  //======================== SREM =========================
  async sRem(key: string, members: string): Promise<number> {
    return await this.client.sRem(key, members);
  }
  //======================== SISMEMBER ====================
  async Sismember(key: string, value: string): Promise<boolean> {
    const result = await this.client.sIsMember(key, value);
    return result === 1;
  }
  //======================== SMEMBERS ====================
  async sMembers(key: string): Promise<string[]> {
    const result = await this.client.sMembers(key);
    return result;
  }
  //======================== MULTI ====================
  multi(): RedisClientMultiCommandTyped<
    [],
    RedisDefaultModules,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {},
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {},
    3,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {}
  > {
    const result = this.client.multi();
    return result;
  }

  //======================== Login out ======================
  RevokeSingleTokenKey(userId: string | Types.ObjectId, jti: string): string {
    return `revoke:${userId}:${jti}`;
  }
  RevokeTokenKey(userId: string | Types.ObjectId): string {
    return `revoke:${userId}`;
  }

  RevokeAllTokenKey(userId: string | Types.ObjectId): string {
    return `revoke_all:${userId}`;
  }
  //======================== attampet Formate ====================

  baseRedis({
    type = RedisTypeEnum.CONFIRMEMAIL,
    key = RedisActionsEnum.REQUEST,
    action,
    blockAction,
  }: RedisKeyParams): string {
    return blockAction
      ? `${type}::${key}::${blockAction}`
      : action
        ? `${type}::${key}::${action}`
        : `${type}::${key}`;
  }

  baseProfileRedis(key: string): string {
    return `profile::view::${key}`;
  }

  RedisKey(params: RedisKeyParams = {}): string {
    return this.baseRedis(params);
  }

  RedisMaxRequestKey(params: RedisKeyParams = {}): string {
    return this.baseRedis(params);
  }

  RedisBlockKey(params: RedisKeyParams = {}): string {
    return this.baseRedis(params);
  }
  //==================== viewer ====================
  View_Key({
    viewId,
    type = viewRedisEnum.STORY,
  }: {
    viewId: Types.ObjectId | string;
    type?: viewRedisEnum;
  }) {
    return `user:${type}:${viewId}`;
  }
  async addViewer(
    targetId: Types.ObjectId | string,
    viewerId: string,
    viewedAt: number
  ) {
    return await this.client.zAdd(targetId.toString(), {
      score: viewedAt,
      value: viewerId,
    });
  }
  async removeViewer(targetId: Types.ObjectId | string, viewerId: string) {
    return await this.client.zRem(targetId.toString(), viewerId);
  }
  async getViewers(targetId: Types.ObjectId | string) {
    return await this.client.zRange(targetId.toString(), 0, -1, {
      REV: true,
    }); // for sorting oldest to newlest
  }
  async getViewersWithDate(targetId: Types.ObjectId | string) {
    return await this.client.zRangeWithScores(targetId.toString(), 0, -1); // for sorting oldest to newlest
  }
  async isViewed(targetId: Types.ObjectId | string, viewerId: Types.ObjectId) {
    const result = await this.client.zScore(
      targetId.toString(),
      viewerId.toString()
    );
    return result !== null;
  }
  async viewerCount(targetId: Types.ObjectId | string) {
    return await this.client.zCard(targetId.toString());
  }
  async removeStoryUser(targetId: Types.ObjectId | string) {
    return await this.client.del(targetId.toString());
  }
  //===================== socket ====================
  socket_Key(userId: Types.ObjectId | string) {
    return `user:socket:${userId}`;
  }

  async addSocktId(
    userId: Types.ObjectId | string,
    socketId: string,
    createdAt: number
  ) {
    return await this.client.zAdd(this.socket_Key(userId), {
      score: createdAt,
      value: socketId,
    });
  }

  async removeSocktId(userId: Types.ObjectId | string, socketId: string) {
    return await this.client.zRem(this.socket_Key(userId), socketId);
  }

  async getSocktIds(userId: Types.ObjectId | string) {
    return await this.client.zRange(this.socket_Key(userId), 0, -1, {
      REV: true,
    }); // for sorting oldest to newlest
  }
  async getSocktIdsWithDate(userId: Types.ObjectId | string) {
    return await this.client.zRangeWithScores(this.socket_Key(userId), 0, -1); // for sorting oldest to newlest
  }

  async socktIdCount(userId: Types.ObjectId | string) {
    return await this.client.zCard(this.socket_Key(userId));
  }

  async removeUserSocket(userId: Types.ObjectId | string) {
    return await this.client.del(this.socket_Key(userId));
  }
}
