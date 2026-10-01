// Load environment variables from .env file
require('dotenv').config();

const { processEvents, processFrigateStatus } = require('./processEvents.js');
const logger = require('./logger.js');
const { polling } = require('../config/settings.js').config;

// How long to wait before asking Frigate again whether it is ready. The first
// check can run while Frigate (or the network it lives on) is still starting -
// after a reboot its nginx answers 502 until the API is back up.
const STARTUP_RETRY_DELAY_MS = 10000;

const pollEventsWithErrorHandling = () => {
    try {
        processEvents();
    } catch (error) {
        logger.error('Error occurred during pollEvents execution:', error);
        process.exit(1); // Exit the application with a non-zero status code
    }
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const startPolling = async () => {
    let status = await processFrigateStatus();

    // Keep retrying instead of giving up after one failed status check, which
    // used to leave the process alive but polling nothing until a restart.
    while (status !== 200) {
        logger.warn(`Frigate is not ready (status: ${status}). Retrying in ${STARTUP_RETRY_DELAY_MS / 1000}s...`);
        await wait(STARTUP_RETRY_DELAY_MS);
        status = await processFrigateStatus();
    }

    logger.info('Frigate is up and running. Starting polling...');

    pollEventsWithErrorHandling();
    setInterval(pollEventsWithErrorHandling, polling.interval * 1000);
};

startPolling();