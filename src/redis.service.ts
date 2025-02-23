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
  private defaultStringsTTL: number = 600;
  private defaultSetsTTL: number = 1200;

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

  async cacheData(key: string, value: string) {
    try {
      await this.client.set(key, value, {
        EX: this.defaultStringsTTL,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async cacheAuthorPosts(key: string, postId: string[]) {
    try {
      await this.client.SADD(key, postId);
      await this.client.expire(key, this.defaultSetsTTL);
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getCachedAuthorPosts(key: string) {
    try {
      return await this.client.SMEMBERS(key);
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getCachedData(key: string) {
    try {
      return await this.client.get(key);
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getMultipleCachedData(keys: string[]) {
    try {
      const cache = await this.client.mGet(keys);
      return cache;
    } catch {
      throw new InternalServerErrorException();
    }
  }
  async cacheMultipleData(items: Record<string, string>) {
    try {
      await this.client.mSet(items);
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async deleteToken(method: 'reset' | 'verify', email: string): Promise<void> {
    await this.client.del(`${method}:${email}`);
  }
}
