import { Injectable } from '@nestjs/common';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

@Injectable()
export class PasswordService {
  private readonly saltLength = 32;
  private readonly keyLength = 64;

  async hash(password: string): Promise<string> {
    const salt = randomBytes(this.saltLength).toString('hex');
    const derivedKey = (await scryptAsync(
      password,
      salt,
      this.keyLength,
    )) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, key] = hashedPassword.split(':');
    const derivedKey = (await scryptAsync(
      password,
      salt,
      this.keyLength,
    )) as Buffer;
    const keyBuffer = Buffer.from(key, 'hex');
    return timingSafeEqual(derivedKey, keyBuffer);
  }
}
