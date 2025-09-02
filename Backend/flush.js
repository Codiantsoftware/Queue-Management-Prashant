const Redis = require("ioredis");

(async () => {
  const redis = new Redis("redis://127.0.0.1:6379");
  await redis.flushall();

  redis.disconnect();
})();
