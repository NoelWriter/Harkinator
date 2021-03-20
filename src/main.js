// ----------------------------------------------------------------
//                           HARKINATOR
// ----------------------------------------------------------------
const config = require("./config/config.json");
const client = require("./client/client")
const utils = require("./utils/utils")
const discordClient = require("./client/discordClient")

discordClient.init(config.DISCORD_TOKEN).then((discordClientInstance) => {
    // Multi-instancing
    let instanceCalls = []

    for (let instance = 0; instance < config.NUM_INSTANCES; instance++) {
        instanceCalls.push(client.execute(config.STOCK_PRIMARY, instance+2, 10000*instance, discordClientInstance))
    }

    Promise.all(instanceCalls)
        .then(results => console.log(results));


})

// Error handling
process.on('SIGINT', () => {
    process.exit();
});

process.on("unhandledRejection", (error) => {
    utils.log.error(`Uncaught Error: ${error}`)
});

process.on("TypeError", (error) => {
    utils.log.error(`Uncaught Error: ${error}`)
});

process.on("uncaughtExceptionMonitor", (error) => {
    utils.log.error(`Uncaught Exception: ${error}`)
});

process.on("warning", (warning) => {
    utils.log.warning(`Warning ${warning}`)
});