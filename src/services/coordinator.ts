import Redis from 'ioredis'
import logger from '../utils/logger.js'
import { config } from '../config/index.js'

export class StateCoordinator {
  private redis: Redis

  constructor() {
    this.redis = new Redis(config.redis.url)
    this.redis.on('error', (err) => {
      logger.warn(`Redis connection issue: ${err.message}`)
    })
  }

  async registerTrigger(contractId: string, keeperId: string): Promise<boolean> {
    try {
      const key = `trigger:${contractId}`
      const lockKey = `lock:${contractId}`
      
      // Try to acquire lock
      const locked = await this.redis.set(lockKey, keeperId, 'EX', 3600, 'NX')
      
      if (!locked) {
        logger.info(`Contract ${contractId} already locked by another keeper`)
        return false
      }

      // Record trigger
      await this.redis.lpush(key, JSON.stringify({
        keeperId,
        timestamp: Date.now(),
      }))

      return true
    } catch (error) {
      logger.warn(`Coordinator error (using local fallback): ${error}`)
      return true // Fallback to local-only coordination
    }
  }

  async acquireLock(contractId: string, ttl: number): Promise<boolean> {
    try {
      const key = `lock:${contractId}:${config.keeper.keeperId}`
      const result = await this.redis.set(key, '1', 'EX', ttl, 'NX')
      return result === 'OK'
    } catch (error) {
      logger.warn(`Lock acquisition failed: ${error}`)
      return true // Optimistic locking fallback
    }
  }

  async releaseLock(contractId: string): Promise<void> {
    try {
      const key = `lock:${contractId}:${config.keeper.keeperId}`
      await this.redis.del(key)
    } catch (error) {
      logger.warn(`Lock release failed: ${error}`)
    }
  }

  async close(): Promise<void> {
    await this.redis.quit()
  }
}
