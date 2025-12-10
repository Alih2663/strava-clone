const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

const redisSubClient = redisClient.duplicate();

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisSubClient.on('error', (err) => console.log('Redis Sub Client Error', err));

const connectRedis = async () => {
    await Promise.all([redisClient.connect(), redisSubClient.connect()]);
    console.log('Redis Connected');
};

module.exports = { redisClient, redisSubClient, connectRedis };
