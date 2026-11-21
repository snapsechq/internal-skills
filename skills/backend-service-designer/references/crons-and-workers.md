# Background Crons and Asynchronous Workers

To prevent CPU and I/O heavy tasks from blocking the HTTP event loop, scheduled tasks (`src/crons/`) and queue consumers (`src/workers/`) run as independent processes separated from the API server.

---

## Process Topology

In production or PM2, the microservice runs as 3 dedicated processes:
1. `src/app.js` (Web Server - clustered or single instance)
2. `src/workers/main.js` (Event consumers & message queue workers)
3. `src/crons/main.cron.js` (Scheduled jobs)

```text
               ┌────────────────────────┐
               │    src/app.js (HTTP)   │
               └───────────┬────────────┘
                           │ (events / messages)
                           ▼
┌──────────────────────────┴──────────────────────────┐
│                                                     │
▼                                                     ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│  src/workers/main.js    │         │  src/crons/main.cron.js │
│  - Message queue (AMQP) │         │  - Periodic sync jobs   │
│  - BullMQ / Redis       │         │  - Cleanup tasks        │
│  - Long-running jobs    │         │  - Overlap lock guards  │
└─────────────────────────┘         └─────────────────────────┘
```

---

## 1. Crons (`src/crons/`)

### Design Rules
1. **Overlap Prevention**: Every cron handler MUST use an in-memory lock (`let isRunning = false;`) or distributed Redis lock to prevent overlapping runs when a tick takes longer than the scheduled interval.
2. **Graceful Try/Catch**: Wrap tick logic in `try/catch/finally` so crashes don't bring down the cron daemon, and the lock is always released.
3. **Dedicated Process**: Never run heavy crons directly in `app.js`. Use `src/crons/main.cron.js` as the launcher.

### Master Cron Launcher (`src/crons/main.cron.js`)
```javascript
// src/crons/main.cron.js
import { connectDb } from "../database/connect.js";
import { statusSyncCron } from "./status-sync.cron.js";
import { cleanupCron } from "./cleanup.cron.js";

// Initialize infrastructure
await connectDb();

// Register and schedule all crons
statusSyncCron();
cleanupCron();

console.log("[CRON] Background cron service initialized and running.");
```

### Individual Cron Job (`src/crons/status-sync.cron.js`)
```javascript
// src/crons/status-sync.cron.js
import cron from "node-cron";

/**
 * Sync statuses every 5 minutes
 */
export const statusSyncCron = () => {
    let isRunning = false;

    // Cron expression: runs every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        // Prevent overlapping executions
        if (isRunning) {
            console.warn("[CRON:StatusSync] Previous tick still executing, skipping...");
            return;
        }

        isRunning = true;
        const startTime = Date.now();
        console.log(`[CRON:StatusSync] Started at ${new Date().toISOString()}`);

        try {
            // Execute business logic (e.g. check pending database records)
            // await ItemService.syncPendingStatuses();
            console.log(`[CRON:StatusSync] Completed successfully in ${Date.now() - startTime}ms`);
        } catch (err) {
            console.error("[CRON:StatusSync] Execution failed:", err.message, err.stack);
        } finally {
            isRunning = false;
        }
    });
};
```

---

## 2. Workers (`src/workers/`)

### Design Rules
1. **Process Isolation**: Workers run in `src/workers/main.js`.
2. **Idempotence**: Every worker must handle duplicate messages gracefully (check if the action has already been performed before mutating state).
3. **Acknowledgment & Error Recovery**: Always acknowledge messages only after successful processing or after dead-lettering unrecoverable errors.
4. **Structured Logging**: Log processing start, job ID, duration, and error details.

### Master Worker Launcher (`src/workers/main.js`)
```javascript
// src/workers/main.js
import { connectDb } from "../database/connect.js";
import { startNotificationWorker } from "./notification.worker.js";
import { startAuditLogWorker } from "./audit-log.worker.js";

// 1. Initialize DB / Cache
await connectDb();

// 2. Start workers
console.log("[WORKERS] Initializing message consumers...");
await startNotificationWorker();
await startAuditLogWorker();

console.log("[WORKERS] All background workers initialized and listening.");
```

### Individual Worker Implementation (`src/workers/notification.worker.js`)
```javascript
// src/workers/notification.worker.js

/**
 * Starts consuming events from queue/broker
 */
export const startNotificationWorker = async () => {
    console.log("[Worker:Notification] Initializing queue subscriber...");

    // Example with generic broker subscriber:
    // await broker.subscribe("notifications.send", async (message, ack) => {
    //     try {
    //         const { recipient, template, data } = message;
    //         await sendEmail(recipient, template, data);
    //         ack(); // Acknowledge completion
    //     } catch (err) {
    //         console.error("[Worker:Notification] Failed to process message:", err);
    //         // Nack or DLQ based on retry strategy
    //     }
    // });
};
```
