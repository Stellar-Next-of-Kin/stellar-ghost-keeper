# 👻 StellarGhost Keeper

**Automated Trigger Service for Decentralized Estate Planning**

The off-chain automation layer that monitors StellarGhost contracts and triggers inheritance release when inactivity thresholds expire. Deploy as a serverless function, containerized service, or traditional server.

## Overview

The StellarGhost Keeper is a critical infrastructure component that automates the inheritance release process. Since smart contracts cannot execute themselves, the keeper network monitors all active contracts and calls `trigger_release()` when the inactivity threshold is exceeded.

Key responsibilities:
- Monitor contract state periodically
- Detect expired inactivity thresholds
- Trigger inheritance release automatically
- Report transaction status to monitoring systems
- Maintain high availability and redundancy

## Architecture

### Simple Architecture (Single Keeper)

```
┌─────────────────┐
│  Schedule/Cron  │
│   (Daily Check)  │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│   Keeper Service     │
│ - Poll contracts     │
│ - Check thresholds   │
│ - Trigger release    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Stellar Blockchain   │
│ (Trigger Txs)        │
└──────────────────────┘
```

### Decentralized Architecture (Keeper Network)

```
┌─────────────────────────────────────┐
│  Multiple Independent Keepers       │
│  (AWS Lambda, Heroku, Self-Hosted)  │
└─────────────────────────────────────┘
           │      │      │
    ┌──────┘      │      └──────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐  ┌────────┐  ┌────────┐
│Keeper 1│  │Keeper 2│  │Keeper 3│
└────────┘  └────────┘  └────────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
         (Coordinate via Redis/DB)
                  │
                  ▼
          Stellar Network
      (Single Trigger Call)
```

## Features

- **Automated Monitoring** - Continuous tracking of all active contracts
- **Threshold Detection** - Identifies contracts where inheritance should trigger
- **Efficient Batching** - Combines multiple triggers into single transaction (future)
- **Error Handling** - Graceful recovery from network failures
- **Logging & Monitoring** - Comprehensive audit trail via logs and events
- **Multiple Deployment Options** - Serverless, Docker, or traditional hosting
- **Duplicate Prevention** - Prevents multiple keepers from triggering same contract
- **Fallback Mechanisms** - Manual trigger capability for beneficiaries if keepers fail

## Components

### 1. Contract Monitor

Continuously polls the Stellar network for contract state changes.

```typescript
interface ContractMonitor {
  // Fetch active contracts
  getActiveContracts(): Promise<ContractInfo[]>;
  
  // Get contract state
  getContractState(contractId: string): Promise<LockboxState>;
  
  // Check if threshold exceeded
  isThresholdExceeded(state: LockboxState): boolean;
  
  // Calculate time remaining
  getTimeRemaining(state: LockboxState): number;
}
```

### 2. Trigger Engine

Executes trigger transactions on the Stellar network.

```typescript
interface TriggerEngine {
  // Trigger inheritance release
  triggerRelease(contractId: string): Promise<TransactionHash>;
  
  // Get transaction status
  getTransactionStatus(txHash: string): Promise<TxStatus>;
  
  // Estimate fees
  estimateFees(contractId: string): Promise<number>;
}
```

### 3. State Coordination

Prevents duplicate triggers in keeper network.

```typescript
interface StateCoordinator {
  // Register trigger attempt
  registerTrigger(contractId: string, keeperId: string): Promise<boolean>;
  
  // Get trigger history
  getTriggerHistory(contractId: string): Promise<TriggerRecord[]>;
  
  // Lock contract to prevent concurrent triggers
  acquireLock(contractId: string, ttl: number): Promise<boolean>;
}
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Stellar testnet/public account with XLM
- Redis (for distributed keeper coordination)
- Keeper secret key (derived from master account)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/stellar-ghost/stellar-ghost-keeper.git
   cd stellar-ghost-keeper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Update `.env`:
   ```
   # Stellar Network
   STELLAR_NETWORK=testnet
   KEEPER_SECRET_KEY=SXX...
   CONTRACT_ID=CXXXX...

   # Monitoring
   CHECK_INTERVAL_MS=86400000  # 24 hours
   STALE_THRESHOLD_SECONDS=604800  # 7 days

   # Redis Coordination (for distributed keeper)
   REDIS_URL=redis://localhost:6379
   KEEPER_ID=keeper-1

   # Logging
   LOG_LEVEL=info
   SLACK_WEBHOOK_URL=https://hooks.slack.com/...

   # Database (for persistent trigger history)
   DATABASE_URL=postgresql://...
   ```

4. **Start the keeper:**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

```bash
# Stellar Configuration
STELLAR_NETWORK=testnet              # testnet or public
KEEPER_SECRET_KEY=SXX...             # Keeper account secret key
HORIZON_URL=https://horizon-testnet.stellar.org

# Contract Monitoring
CHECK_INTERVAL_MS=86400000           # Poll interval (ms)
BATCH_SIZE=100                       # Contracts per poll
STALE_THRESHOLD_SECONDS=604800       # Consider contract stale after 7 days

# Keeper Coordination (distributed setup)
REDIS_URL=redis://localhost:6379
KEEPER_ID=keeper-1                   # Unique identifier for this keeper
LOCK_TTL_SECONDS=3600                # Lock expiry time

# Logging & Monitoring
LOG_LEVEL=info                        # debug, info, warn, error
LOG_FORMAT=json                       # json or text
SLACK_WEBHOOK_URL=https://...        # Slack notifications
DATADOG_API_KEY=xxx                  # Datadog monitoring
SENTRY_DSN=https://...               # Error tracking

# Database
DATABASE_URL=postgresql://user:pass@host/db
DB_POOL_SIZE=10

# Performance
MAX_RETRIES=3
RETRY_DELAY_MS=5000
TIMEOUT_MS=30000
```

## Deployment

### Local Development

```bash
npm run dev
```

### Docker

```bash
# Build image
docker build -t stellar-ghost-keeper .

# Run container
docker run --env-file .env stellar-ghost-keeper

# Docker Compose
docker-compose up
```

### AWS Lambda (Serverless)

1. **Build for Lambda:**
   ```bash
   npm run build:lambda
   ```

2. **Deploy:**
   ```bash
   serverless deploy
   ```

3. **Configure CloudWatch Events:**
   - Trigger Lambda once daily
   - Set timeout to 5 minutes
   - Configure dead-letter queue for failures

### Heroku

```bash
# Create app
heroku create stellar-ghost-keeper

# Set environment variables
heroku config:set STELLAR_NETWORK=testnet KEEPER_SECRET_KEY=SXX...

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Kubernetes

```bash
# Create namespace
kubectl create namespace stellar-ghost

# Create secret
kubectl create secret generic keeper-config \
  --from-literal=KEEPER_SECRET_KEY=SXX... \
  -n stellar-ghost

# Deploy
kubectl apply -f k8s/deployment.yaml -n stellar-ghost

# Check status
kubectl get pods -n stellar-ghost
```

## Usage

### Start Keeper

```bash
npm start
```

### Dry Run (Check without triggering)

```bash
npm run dry-run
```

### Manual Trigger

```bash
npm run trigger -- --contract-id CXXXX...
```

### Get Keeper Status

```bash
npm run status
```

## Monitoring & Observability

### Logs

All keeper activity is logged with structured JSON output:

```json
{
  "timestamp": "2026-07-14T15:00:00Z",
  "level": "info",
  "keeper_id": "keeper-1",
  "action": "trigger_released",
  "contract_id": "CXXXX...",
  "tx_hash": "abcd1234...",
  "gas_used": 1000,
  "duration_ms": 2500
}
```

### Metrics

Track key performance indicators:
- Contracts monitored
- Successful triggers per hour/day
- Average trigger latency
- Failed triggers and retry counts
- Keeper uptime percentage

### Alerting

Configure alerts for:
- Keeper process crashes
- Network connectivity issues
- Trigger transaction failures
- Suspicious activity (multiple triggers on same contract)
- Redis connection failures

## API Endpoints

If running as a service:

```bash
# Health check
GET /health

# Keeper status
GET /status

# Trigger contract manually
POST /trigger
  Body: { "contract_id": "CXXXX..." }

# Get metrics
GET /metrics

# Get trigger history
GET /history?contract_id=CXXXX...
```

## Security Considerations

### Secret Key Management

- **Never hardcode** secret key in code
- **Use environment variables** for all sensitive data
- **Rotate keys** regularly
- **Limit permissions** - keeper account should only trigger contracts, not withdraw

### Network Security

- **HTTPS only** for all external requests
- **IP whitelisting** if possible
- **Rate limiting** to prevent abuse
- **DDoS protection** for public endpoints

### Trigger Validation

- **Verify threshold** before triggering
- **Check double-trigger** prevention
- **Validate contract state** immutability
- **Log all triggers** for audit trail

## Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- --testNamePattern="trigger"

# Test coverage
npm run test:coverage

# Integration tests (requires testnet setup)
npm run test:integration

# Load testing
npm run test:load
```

## Troubleshooting

### Keeper Not Triggering

1. **Check logs** for error messages
2. **Verify keeper account** has XLM for fees
3. **Test contract** manually via CLI
4. **Check network** connectivity
5. **Verify contract ID** is correct

### High Transaction Fees

1. **Batch multiple triggers** (future optimization)
2. **Adjust check frequency** to reduce retries
3. **Use cheaper network** operations
4. **Monitor fee trends** on Stellar

### Duplicate Triggers

1. **Enable Redis coordination** for keeper network
2. **Implement locking mechanism** (see state-coordinator)
3. **Add duplicate detection** in database
4. **Verify keeper IDs** are unique

## Performance Tuning

```bash
# Reduce polling frequency
CHECK_INTERVAL_MS=604800000  # Weekly instead of daily

# Increase batch size
BATCH_SIZE=1000  # Process more contracts per poll

# Parallel processing
MAX_CONCURRENT_TRIGGERS=10

# Connection pooling
DB_POOL_SIZE=20
```

## File Structure

```
stellar-ghost-keeper/
├── src/
│   ├── index.ts                    # Entry point
│   ├── keeper.ts                   # Main keeper logic
│   ├── monitor.ts                  # Contract monitor
│   ├── trigger-engine.ts           # Trigger executor
│   ├── coordinator.ts              # Distributed coordination
│   ├── config.ts                   # Configuration loader
│   ├── logger.ts                   # Logging setup
│   ├── stellar-utils.ts            # Stellar SDK wrappers
│   ├── db/
│   │   ├── client.ts               # Database connection
│   │   ├── triggers.ts             # Trigger history queries
│   │   └── migrations/             # Database migrations
│   ├── handlers/
│   │   ├── api.ts                  # API endpoints
│   │   ├── lambda.ts               # AWS Lambda handler
│   │   └── cron.ts                 # Cron task handler
│   └── tests/
│       ├── keeper.test.ts
│       ├── monitor.test.ts
│       └── trigger-engine.test.ts
├── Dockerfile
├── docker-compose.yml
├── serverless.yml                  # Serverless config
├── k8s/                            # Kubernetes manifests
├── .env.example
├── package.json
└── README.md
```

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Commit with clear messages
6. Push and create a Pull Request

## Development

```bash
npm run dev         # Start with hot reload
npm run build       # Build TypeScript
npm test            # Run tests
npm run lint        # Run ESLint
npm run format      # Format code
```

## License

MIT License - see LICENSE file for details.

## Support & Community

- **Issues:** Report bugs on GitHub
- **Discussions:** GitHub Discussions
- **Discord:** Stellar Developer Community
- **Security:** security@stellarghost.dev

---

**Part of the 👻 StellarGhost ecosystem**

For more information, visit the [main monorepo](https://github.com/stellar-ghost/stellar-ghost).
