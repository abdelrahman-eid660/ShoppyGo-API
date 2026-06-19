// import {  RateLimiterRedis } from 'rate-limiter-flexible';
// import { redisService, RedisService } from './redis.service';
// import { Types } from 'mongoose';
// export class RateLimiterServer {
//     private readonly globalLimiter: RateLimiterRedis;
//     private readonly userLimiter: RateLimiterRedis;
//     private readonly postLimiter: RateLimiterRedis;
//     private readonly commentLimiter: RateLimiterRedis;
//     private readonly storyLimiter: RateLimiterRedis;
//     private readonly redis: RedisService;
//     constructor(){
//         this.redis = redisService
//         const redisNativeClient = this.redis.nativeClient
//         this.globalLimiter = new RateLimiterRedis({
//             storeClient : redisNativeClient,
//             keyPrefix : "rl:Global",
//             useRedisPackage: require('redis'),
//             points : 100 ,
//             duration : 60
//         })
//         this.userLimiter = new RateLimiterRedis({
//             storeClient : redisNativeClient,
//             keyPrefix : "rl:User",
//             useRedisPackage: require('redis'),
//             points : 15,
//             duration : 60
//         })
//         this.postLimiter = new RateLimiterRedis({
//             storeClient : redisNativeClient,
//             keyPrefix : "rl:Post",
//             useRedisPackage: require('redis'),
//             points : 20,
//             duration : 60
//         })
//         this.commentLimiter = new RateLimiterRedis({
//             storeClient : redisNativeClient,
//             keyPrefix : "rl:Comment",
//             useRedisPackage: require('redis'),
//             points : 10,
//             duration : 60
//         })
//         this.storyLimiter = new RateLimiterRedis({
//             storeClient : redisNativeClient,
//             keyPrefix : "rl:Story",
//             useRedisPackage: require('redis'),
//             points : 5,
//             duration : 60
//         })
//     }
//     // GLOBAL LIMITER
//      consumeGlobal = async(ip : string):Promise<void>=>{
//         await this.globalLimiter.consume(ip)
//     }
//     // USER LIMITER
//      consumeUserAction = async(userId : Types.ObjectId):Promise<void>=>{
//         await this.userLimiter.consume(userId.toString())
//     }
//     // POST LIMITER
//      consumePostAction = async(userId : Types.ObjectId):Promise<void>=>{
//         await this.postLimiter.consume(userId.toString())
//     }
//     // COMMENT LIMITER
//      consumeCommentAction = async(userId : Types.ObjectId):Promise<void>=>{
//         await this.commentLimiter.consume(userId.toString())
//     }
//     // STORY LIMITER
//      consumeStoryAction = async(userId : Types.ObjectId):Promise<void>=>{
//         await this.storyLimiter.consume(userId.toString())
//     }
// }
// export const rateLimiterServer = new RateLimiterServer()
