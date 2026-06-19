import {
  CompleteMultipartUploadCommandOutput,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { StorageApproachEnum, UploadApproachEnum } from '../enum';
import { createReadStream } from 'node:fs';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class S3Service {
  private client: S3Client;
  APPLICATION_NAME!: string
  AWS_ACCESS_KEY_ID!: string
  AWS_BUCKET_NAME!: string
  AWS_EXPIRES_IN!: number
  AWS_REGION!: string
  AWS_SECRET_ACCESS_KEY!: string
  constructor(private readonly configService : ConfigService) {
    
  this.APPLICATION_NAME = this.configService.get<string>('APPLICATION_NAME')as string
  this.AWS_ACCESS_KEY_ID = this.configService.get<string>('AWS_ACCESS_KEY_ID')as string
  this.AWS_BUCKET_NAME = this.configService.get<string>('AWS_BUCKET_NAME')as string
  this.AWS_EXPIRES_IN = parseInt(this.configService.get<string>('AWS_EXPIRES_IN')as string)
  this.AWS_REGION = this.configService.get<string>('AWS_REGION')as string
  this.AWS_SECRET_ACCESS_KEY = this.configService.get<string>('AWS_SECRET_ACCESS_KEY')as string  
    this.client = new S3Client({
      region: this.AWS_REGION,
      credentials: {
        accessKeyId: this.AWS_ACCESS_KEY_ID,
        secretAccessKey: this.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  async uploadAsset({
    storageApproach = StorageApproachEnum.MEMORY,
    Bucket = this.AWS_BUCKET_NAME,
    path = `${this.APPLICATION_NAME}`,
    file,
    ACL = ObjectCannedACL.private,
    ContentType,
  }: {
    storageApproach?: StorageApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string | undefined;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket,
      Key: `${this.APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
      ACL,
      Body:
        storageApproach === StorageApproachEnum.MEMORY
          ? file.buffer
          : createReadStream(file.path),
      ContentType: file.mimetype || ContentType,
    });
    if (!command.input?.Key) {
      throw new BadRequestException('Fail to upload this asset to AWS');
    }
    await this.client.send(command);
    return command.input?.Key;
  }
  async uploadLargAsset({
    storageApproach = StorageApproachEnum.DISK,
    Bucket = this.AWS_BUCKET_NAME,
    path = `${this.APPLICATION_NAME}`,
    file,
    ACL = ObjectCannedACL.private,
    ContentType,
    partSize = 5,
  }: {
    storageApproach?: StorageApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string | undefined;
    partSize?: number;
  }): Promise<CompleteMultipartUploadCommandOutput> {
    const uploadFile = new Upload({
      client: this.client,
      params: {
        Bucket,
        Key: `${this.APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
        Body:
          storageApproach === StorageApproachEnum.MEMORY
            ? file.buffer
            : createReadStream(file.path),
        ACL: ObjectCannedACL.private,
        ContentType,
      },
      partSize: partSize * 1024 * 1024,
    });
    uploadFile.on('httpUploadProgress',(progress) => {
        console.log(progress);
        console.log(`File Upload ${(progress.loaded as number) / (progress.total as number) * 100}%`);
      }
    );
    return await uploadFile.done();
  }
  async uploadAssets({
    uploadApproach = UploadApproachEnum.SMALL,
    storageApproach = StorageApproachEnum.MEMORY,
    Bucket = this.AWS_BUCKET_NAME,
    path = `${this.APPLICATION_NAME}`,
    files,
    ACL = ObjectCannedACL.private,
    ContentType,
  }: {
    uploadApproach?: UploadApproachEnum;
    storageApproach?: StorageApproachEnum;
    Bucket?: string;
    path?: string;
    files: Express.Multer.File[];
    ACL?: ObjectCannedACL;
    ContentType?: string | undefined;
  }): Promise<string[]> {
    let urls: string[] = [];
    if (uploadApproach === UploadApproachEnum.LARGE) {
      const data = await Promise.all(
        files.map((file) => {
          return this.uploadLargAsset({
            storageApproach,
            Bucket,
            path,
            file,
            ACL,
            ContentType,
          });
        })
      );
      urls = data.map((ele) => ele.Key as string);
    } else {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadAsset({
            storageApproach,
            Bucket,
            path,
            file,
            ACL,
            ContentType,
          });
        })
      );
    }
    console.log({ urls });
    return urls;
  }
  async getAsset({
    Bucket = this.AWS_BUCKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<GetObjectCommandOutput> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    });
    return await this.client.send(command);
  }
  async deleteAsset({
    Bucket = this.AWS_BUCKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<DeleteObjectCommandOutput> {
    const command = new DeleteObjectCommand({
      Bucket,
      Key,
    });
    return await this.client.send(command);
  }
  async deleteAssets({
    Bucket = this.AWS_BUCKET_NAME,
    Keys,
  }: {
    Bucket?: string;
    Keys: { Key: string }[];
  }): Promise<DeleteObjectsCommandOutput> {
    const command = new DeleteObjectsCommand({
      Bucket,
      Delete: {
        Objects: Keys,
        Quiet: false,
      },
    });
    return await this.client.send(command);
  }
  async listFolderDir({
    Bucket = this.AWS_BUCKET_NAME,
    Prefix,
  }: {
    Bucket?: string;
    Prefix: string;
  }): Promise<ListObjectsV2CommandOutput> {
    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: `${this.APPLICATION_NAME}/${Prefix}`,
    });
    return await this.client.send(command);
  }
  async deleteFolderByPreifx({
    Bucket = this.AWS_BUCKET_NAME,
    Prefix,
  }: {
    Bucket?: string;
    Prefix: string;
  }): Promise<DeleteObjectsCommandOutput> {
    const results = await this.listFolderDir({ Bucket, Prefix });
    const Keys = results.Contents?.map((ele) => {
      return { Key: ele.Key };
    }) as { Key: string }[];
    return await this.deleteAssets({ Bucket, Keys });
  }
  async createPreSignedUploadLink({
    Bucket = this.AWS_BUCKET_NAME,
    path = `${this.APPLICATION_NAME}`,
    ContentType,
    OriginalName,
    expiresIn = this.AWS_EXPIRES_IN,
  }: {
    Bucket?: string;
    path?: string;
    ContentType: string;
    OriginalName: string;
    expiresIn?: number;
  }): Promise<{ url: string; Key: string }> {
    const command = new PutObjectCommand({
      Bucket,
      Key: `${this.APPLICATION_NAME}/${path}/${randomUUID()}__${OriginalName}`,
      ContentType,
    });
    if (!command.input?.Key) {
      throw new BadRequestException('Fail to upload this asset to AWS');
    }
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return { url, Key: command.input.Key };
  }
  async createPreSignedFetchLink({
    Bucket = this.AWS_BUCKET_NAME,
    Key,
    expiresIn = this.AWS_EXPIRES_IN,
    fileName,
    download,
  }: {
    Bucket?: string;
    Key: string;
    expiresIn?: number;
    fileName?: string | undefined;
    download?: string | undefined;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
      ResponseContentDisposition:
        download === 'true'
          ? `attachment; filename="${fileName || Key.split('/').pop()}"`
          : undefined,
    });
    if (!command.input?.Key) {
      throw new BadRequestException('Fail to upload this asset to AWS');
    }
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return url;
  }
}