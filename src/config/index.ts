import dotenv from 'dotenv'

dotenv.config()

export const config = {
  stellar: {
    network: (process.env.STELLAR_NETWORK || 'testnet') as 'testnet' | 'public',
    contractId: process.env.CONTRACT_ID || '',
    horizonUrl: process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org',
  },
  keeper: {
    secretKey: process.env.KEEPER_SECRET_KEY || '',
    checkIntervalMs: parseInt(process.env.CHECK_INTERVAL_MS || '86400000'),
    keeperId: process.env.KEEPER_ID || 'keeper-1',
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
}

export function validateConfig() {
  const required = ['CONTRACT_ID', 'KEEPER_SECRET_KEY']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
