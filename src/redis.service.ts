import {
  Injectable,
  InternalServerErrorException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => console.error('Redis error:', err));
  }

  async onModuleInit() {
    await this.client.connect();
    // console.log('✅ Connected to Redis');
  }

  async onModuleDestroy() {
    await this.client.quit();
    // console.log('❌ Disconnected from Redis');
  }

  async setToken(
    method: 'reset' | 'verify',
    email: string,
    token: string,
    ttlSeconds: number,
  ) {
    try {
      await this.client.set(`${method}:${email}`, token, { EX: ttlSeconds });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getToken(
    method: 'reset' | 'verify',
    email: string,
  ): Promise<string | null> {
    return await this.client.get(`${method}:${email}`);
  }

  async deleteToken(method: 'reset' | 'verify', email: string): Promise<void> {
    await this.client.del(`${method}:${email}`);
  }
}
