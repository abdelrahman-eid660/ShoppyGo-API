import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityService {
  constructor(private configService: ConfigService) {}
  generateEncryption = async (plainText: string): Promise<string> => {
    const iv = randomBytes(Number(this.configService.get('IV_LENGTH')));
    const cipherIV = createCipheriv(
      'aes-256-cbc',
      String(this.configService.get('ENCRYPTION_SECRET_KEY')),
      iv
    );
    let cipherText = cipherIV.update(plainText, 'utf-8', 'hex');
    cipherText += cipherIV.final('hex');
    return `${iv.toString('hex')}:${cipherText}`;
  };
  generateDecryption = async (cipherText: string): Promise<string> => {
    const [iv, encryptedData] = cipherText.split(':') || [];
    if (!iv || !encryptedData) {
      throw new BadRequestException('Fail to Encrypt');
    }
    const ivLIKEBinary = Buffer.from(iv, 'hex');
    const decipherIV = createDecipheriv(
      'aes-256-cbc',
      String(this.configService.get('ENCRYPTION_SECRET_KEY')),
      ivLIKEBinary
    );
    let plainText = decipherIV.update(encryptedData, 'hex', 'utf-8');
    plainText += decipherIV.final('utf-8');
    return plainText;
  };

  generateHash = async (
    plainText: string,
    salt: number = Number(this.configService.get('SALT_ROUND'))
  ): Promise<string> => {
    return await hash(plainText, salt);
  };

  compareHash = async (
    plainText: string,
    cipherText: string
  ): Promise<boolean> => {
    return await compare(plainText, cipherText);
  };
}
