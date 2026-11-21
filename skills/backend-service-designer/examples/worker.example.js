// examples/worker.example.js
/**
 * Asynchronous event consumer
 */
export const startExampleWorker = async () => {
    console.log("[Worker:Example] Initializing queue subscriber...");

    // Generic subscriber pattern:
    // await messageBroker.subscribe("events.domain.action", async (event, ack) => {
    //     try {
    //         console.log(`[Worker:Example] Processing event ${event.id}`);
    //         await processEvent(event);
    //         ack();
    //     } catch (err) {
    //         console.error("[Worker:Example] Processing error:", err);
    //     }
    // });
};
