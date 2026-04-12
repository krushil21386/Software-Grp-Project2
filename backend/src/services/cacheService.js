const { redisClient } = require('../config/redisClient');
const logger = require('./loggerService');

const DEFAULT_EXPIRATION = 3600; // 1 hour

const cacheService = {
    /**
     * Get data from cache.
     */
    async get(key) {
        try {
            const data = await redisClient.get(key);
            if (data) {
                logger.info(`💾 Cache HIT for key: ${key}`);
                return JSON.parse(data);
            }
            logger.info(`❄️ Cache MISS for key: ${key}`);
            return null;
        } catch (err) {
            logger.error('Cache Get Error:', err);
            return null;
        }
    },

    /**
     * Set data in cache.
     */
    async set(key, value, duration = DEFAULT_EXPIRATION) {
        try {
            await redisClient.setEx(key, duration, JSON.stringify(value));
            logger.info(`📝 Cache SET for key: ${key} (TTL: ${duration}s)`);
        } catch (err) {
            logger.error('Cache Set Error:', err);
        }
    },

    /**
     * Delete data from cache.
     */
    async del(key) {
        try {
            await redisClient.del(key);
            logger.info(`🗑️ Cache DEL for key: ${key}`);
        } catch (err) {
            logger.error('Cache Del Error:', err);
        }
    },

    /**
     * Pattern-based cache invalidation.
     */
    async invalidatePattern(pattern) {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
                logger.info(`🗑️ Invalidated ${keys.length} keys with pattern: ${pattern}`);
            }
        } catch (err) {
            logger.error('Cache Invalidation Error:', err);
        }
    }
};

module.exports = cacheService;
