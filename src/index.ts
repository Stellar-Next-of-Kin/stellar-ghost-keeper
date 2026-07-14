import { validateConfig, config } from './config/index.js'
import { ContractMonitor } from './services/monitor.js'
import { TriggerEngine } from './services/trigger.js'
import { StateCoordinator } from './services/coordinator.js'
import { HealthCheck } from './services/healthcheck.js'
import logger from './utils/logger.js'

class Keeper {
  private monitor: ContractMonitor
  private engine: TriggerEngine
  private coordinator: StateCoordinator
  private healthCheck: HealthCheck
  private running = true

  constructor() {
    validateConfig()
    this.monitor = new ContractMonitor()
    this.engine = new TriggerEngine()
    this.coordinator = new StateCoordinator()
    this.healthCheck = new HealthCheck()
  }

  async run(): Promise<void> {
    logger.info('🚀 StellarGhost Keeper started')
    logger.info(`   Contract: ${config.stellar.contractId}`)
    logger.info(`   Network: ${config.stellar.network}`)
    logger.info(`   Check interval: ${config.keeper.checkIntervalMs}ms`)

    // Health check
    await this.healthCheck.check()

    // Check immediately
    await this.check()

    // Then check periodically
    setInterval(() => this.check(), config.keeper.checkIntervalMs)

    // Health check every 5 minutes
    setInterval(async () => {
      await this.healthCheck.check()
    }, 5 * 60 * 1000)

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...')
      this.running = false
      await this.coordinator.close()
      process.exit(0)
    })
  }

  private async check(): Promise<void> {
    if (!this.running) return

    try {
      logger.info('📊 Running keeper check...')

      // Try to acquire coordination lock
      const hasLock = await this.coordinator.acquireLock(
        config.stellar.contractId,
        10000 // 10 second lock
      )

      if (!hasLock) {
        logger.debug('Skipped check - another keeper has lock')
        return
      }

      try {
        // Check if threshold exceeded
        const exceeded = await this.monitor.isThresholdExceeded(
          config.stellar.contractId
        )

        if (exceeded) {
          logger.info('⚠️ Threshold exceeded! Triggering inheritance...')
          
          const registered = await this.coordinator.registerTrigger(
            config.stellar.contractId,
            config.keeper.keeperId
          )

          if (registered) {
            const txHash = await this.engine.triggerRelease(
              config.stellar.contractId
            )
            logger.info(`✅ Inheritance triggered: ${txHash}`)
          }
        } else {
          logger.debug('✓ Threshold not yet exceeded')
        }
      } finally {
        await this.coordinator.releaseLock(config.stellar.contractId)
      }
    } catch (error) {
      logger.error(`❌ Keeper check failed: ${error}`)
      // Continue running despite errors
    }
  }
}

const keeper = new Keeper()
keeper.run().catch(err => {
  logger.error(`💥 Fatal error: ${err}`)
  process.exit(1)
})
// Service feature 1
// Service feature 2
// Service feature 3
// Service feature 4
// Service feature 5
// Service feature 6
// Service feature 7
// Service feature 8
// Service feature 9
// Service feature 10
// Service feature 11
// Service feature 12
// Service feature 13
// Service feature 14
// Service feature 15
