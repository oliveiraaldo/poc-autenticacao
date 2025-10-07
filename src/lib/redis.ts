import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const rotateSecurityKey = async (oldKey: string, newKey: string, ttlSeconds: number) => {
  const script = `
    local v = redis.call('GET', KEYS[1])
    if not v then return nil end
    redis.call('SET', KEYS[2], v, 'EX', ARGV[1])
    redis.call('DEL', KEYS[1])
    return v
  `;
  const res = await redis.eval(script, 2, oldKey, newKey, ttlSeconds);
  return res; // valor antigo (laravel_jwt) ou null
};
