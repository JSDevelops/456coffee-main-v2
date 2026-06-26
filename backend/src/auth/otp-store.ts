import { Injectable } from '@nestjs/common';

export interface OtpRecord {
  code: string;
  expires: number; // epoch ms
}

/**
 * Pluggable OTP storage. Default impl is in-memory (per-instance) — fine for
 * dev and single-instance deploys, but loses state on restart and gets out of
 * sync across replicas.
 *
 * To swap to Redis (multi-instance / persistent):
 *   1. `npm install ioredis`
 *   2. Provide a class that implements OtpStore using `redis.set(key, value, 'PX', ttlMs)` /
 *      `redis.get` / `redis.del`.
 *   3. In app.module.ts replace `OtpStore` provider with the Redis impl
 *      (or use `useFactory` to choose based on `process.env.REDIS_URL`).
 */
export abstract class OtpStore {
  abstract set(phone: string, record: OtpRecord): Promise<void>;
  abstract get(phone: string): Promise<OtpRecord | null>;
  abstract delete(phone: string): Promise<void>;
}

@Injectable()
export class InMemoryOtpStore extends OtpStore {
  private map = new Map<string, OtpRecord>();

  async set(phone: string, record: OtpRecord): Promise<void> {
    this.map.set(phone, record);
  }

  async get(phone: string): Promise<OtpRecord | null> {
    const rec = this.map.get(phone);
    if (!rec) return null;
    // Lazy expiration sweep — drop the entry once it's stale.
    if (rec.expires < Date.now()) {
      this.map.delete(phone);
      return null;
    }
    return rec;
  }

  async delete(phone: string): Promise<void> {
    this.map.delete(phone);
  }
}
