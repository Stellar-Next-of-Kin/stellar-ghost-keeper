import { validateConfig, config } from './config/index.js'
import { ContractMonitor } from './services/monitor.js'
import { TriggerEngine } from './services/trigger.js'
import logger from './utils/logger.js'

class Keeper {
  private monitor: ContractMonitor
  private engine: TriggerEngine

  constructor() {
    validateConfig()
    this.monitor = new ContractMonitor()
    this.engine = new TriggerEngine()
  }

  async run(): Promise<void> {
    logger.info('StellarGhost Keeper started')
    logger.info(`Contract ID: ${config.stellar.contractId}`)
    logger.info(`Check interval: ${config.keeper.checkIntervalMs}ms`)

    // Check immediately
    await this.check()

    // Then check periodically
    setInterval(() => this.check(), config.keeper.checkIntervalMs)
  }

  private async check(): Promise<void> {
    try {
      logger.info('Running keeper check...')

      // Check if threshold exceeded
      const exceeded = await this.monitor.isThresholdExceeded(config.stellar.contractId)

      if (exceeded) {
        logger.info('Threshold exceeded! Triggering inheritance...')
        const txHash = await this.engine.triggerRelease(config.stellar.contractId)
        logger.info(`Inheritance triggered: ${txHash}`)
      } else {
        logger.debug('Threshold not yet exceeded')
      }
    } catch (error) {
      logger.error(`Keeper check failed: ${error}`)
    }
  }
}

const keeper = new Keeper()
keeper.run().catch(err => {
  logger.error(`Fatal error: ${err}`)
  process.exit(1)
})
