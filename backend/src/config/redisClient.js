const redis = require('redis');
const logger = require('../services/loggerService');
// Mock Redis Client for local stability if server is missing
const mockClient = {
    get: async () => null,
    set: async () => null,
    del: async () => null,
    on: () => {},
    connect: async () => { logger.warn('⚠️  Redis server missing. System is running in Local Memory Mode.'); },
    isMock: true
};

let activeClient = mockClient;
let isReady = false;

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 2) {
                logger.warn('⚠️  Redis unreachable. Falling back to Mock Memory Mode.');
                return false; // Stop real retries
            }
            return 500;
        }
    }
});

redisClient.on('error', (err) => {
    if (!isReady) return;
    logger.error('Redis Runtime Error:', err);
});

redisClient.on('connect', () => {
    isReady = true;
    activeClient = redisClient;
    logger.info('🚀 Connected to Redis Server');
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        activeClient = mockClient;
    }
};

module.exports = { 
    redisClient: new Proxy({}, {
        get: (target, prop) => activeClient[prop]
    }), 
    connectRedis, 
    isRedisReady: () => isReady 
};
