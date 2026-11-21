// examples/cron.example.js
import cron from "node-cron";

/**
 * Scheduled job with overlap prevention guard
 */
export const exampleCron = () => {
    let isRunning = false;

    // Run every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
        if (isRunning) {
            console.warn("[CRON:Example] Prior execution active, skipping tick...");
            return;
        }

        isRunning = true;
        const start = Date.now();
        console.log(`[CRON:Example] Executing scheduled tick at ${new Date().toISOString()}`);

        try {
            // Place async business logic here
            // await EntityService.cleanupExpiredItems();
            console.log(`[CRON:Example] Completed in ${Date.now() - start}ms`);
        } catch (err) {
            console.error("[CRON:Example] Execution error:", err.message);
        } finally {
            isRunning = false;
        }
    });
};
