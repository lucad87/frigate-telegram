const { fetchEvents } = require('./fetchEvents.js');
const { formatEventMessage } = require('./utils.js');
const { fetchFrigateStatus } = require('./fetchStatus.js');
const { frigate } = require('../config/settings.js').config;
const telegram = require('./telegramBot.js');
const logger = require('./logger.js');

const processEvent = async (event) => {
    try {
        if (telegram.getNotificationsEnabled()) { // Check if notifications are enabled
            logger.info(`Event ${event.id} received`);

            const eventMessage = formatEventMessage(event, frigate.mediaUrl);
            const thumbnailBuffer = Buffer.from(event.thumbnail, 'base64');

            telegram.sendPhoto(eventMessage, thumbnailBuffer, event.id);

            logger.info(`Event ${event.id} sent to Telegram`);
        } else {
            logger.info(`Notifications are disabled. Skipping event ${event.id}.`);
        }
    } catch (error) {
        logger.error(`Error processing event ${event.id}`, error);
    }
};

const processEvents = async () => {
    try {
        const events = await fetchEvents();

        if (events && events.length > 0) {
            await Promise.all(events.map(processEvent));
            logger.info('All events sent to Telegram');
        }
    } catch (error) {
        logger.error('Error processing events', error);
    }
};

const processFrigateStatus = async () => {
    try {
        return await fetchFrigateStatus();
    } catch (error) {
        logger.error('Error processing Frigate status', {
            message: error.message,
            stack: error.stack
        });
    }
};

module.exports = { processEvents, processFrigateStatus };