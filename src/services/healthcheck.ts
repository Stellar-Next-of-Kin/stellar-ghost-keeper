import logger from '../utils/logger.js'
import { TriggerEngine } from './trigger.js'
import { ContractMonitor } from './monitor.js'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  checks: {
    network: boolean
    keeper: boolean
    coordinator: boolean
    lastCheck: number
  }
}

export class HealthCheck {
  private monitor: ContractMonitor
  private engine: TriggerEngine
  private lastStatus: HealthStatus

  constructor() {
    this.monitor = new ContractMonitor()
    this.engine = new TriggerEngine()
    this.lastStatus = {
      status: 'healthy',
      timestamp: Date.now(),
      checks: {
        network: false,
        keeper: false,
        coordinator: false,
        lastCheck: 0,
      },
    }
  }

  async check(): Promise<HealthStatus> {
    const networkOk = await this.checkNetwork()
    const keeperOk = await this.checkKeeper()

    this.lastStatus = {
      status: networkOk && keeperOk ? 'healthy' : 'degraded',
      timestamp: Date.now(),
      checks: {
        network: networkOk,
        keeper: keeperOk,
        coordinator: true, // Optional component
        lastCheck: Date.now(),
      },
    }

    logger.info(`Health check: ${this.lastStatus.status}`)
    return this.lastStatus
  }

  private async checkNetwork(): Promise<boolean> {
    try {
      // Network check would verify Stellar connectivity
      return true
    } catch {
      return false
    }
  }

  private async checkKeeper(): Promise<boolean> {
    try {
      // Keeper check would verify contract access
      return true
    } catch {
      return false
    }
  }

  getStatus(): HealthStatus {
    return this.lastStatus
  }
}
