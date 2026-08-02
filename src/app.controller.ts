import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { S3Service } from './common/service';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import type { Request, Response } from 'express';
import { AuthenticationGuard } from './common/guard';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
const s3WriteStream = promisify(pipeline);
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly s3: S3Service,
    @Inject(CACHE_MANAGER) private cacheManger: Cache
  ) {}
  
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('/api/uploads/*path')
  async getFiles(@Req() req: Request, @Res() res: Response) {
    const { download, fileName } = req.query as {
      download: string;
      fileName: string;
    };
    const { path } = req.params as { path: string[] };
    const Key = path.join('/');
    const { Body, ContentType } = await this.s3.getAsset({ Key });
    res.setHeader('Content-Type', ContentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // cashing for 1 year
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    if (download === 'true') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName || Key.split('/').pop()}"`
      );
    }
    return await s3WriteStream(Body as NodeJS.ReadableStream, res);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(AuthenticationGuard)
  @Post('/api/create-presigned-link')
  async createPreSignedLink(@Req() req: Request) {
    const { ContentType, OriginalName, path } = req.body;
    if (!ContentType || !OriginalName || !path) {
      throw new BadRequestException('Bad Request check from your Data');
    }
    return await this.s3.createPreSignedUploadLink({
      ContentType,
      OriginalName,
      path,
    });
  } 

  @Throttle({ default: { limit: 300, ttl: 60000 } })
  @Get('/api/pre-signed/*path')
  async getByPreSigned(@Req() req: Request) {
    const { download, fileName } = req.query as {
      download: string;
      fileName: string;
    };
    const { path } = req.params as { path: string[] };
    const Key = path.join('/');
    return await this.s3.createPreSignedFetchLink({
      Key,
      download,
      fileName,
    });
  }
}
