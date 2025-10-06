import Redis from "ioredis";

// Configuração do Redis usando variáveis de ambiente
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  keyPrefix: process.env.REDIS_PREFIX || '',
  maxRetriesPerRequest: 3, // Reduz tentativas para evitar o erro
  retryDelayOnFailover: 100,
  lazyConnect: true, // Conecta apenas quando necessário
});

// Log de configuração em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('Redis configurado:', {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || '6379',
    prefix: process.env.REDIS_PREFIX || '',
  });
}

export default redis;