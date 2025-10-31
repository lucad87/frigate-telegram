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
            
            // Frigate no longer includes thumbnails in the events response by default
            // We need to fetch it from the dedicated thumbnail endpoint
            // Retry a few times in case the thumbnail is not immediately available
            const axios = require('axios');
            const maxRetries = 3;
            const retryDelay = 1000; // 1 second
            let thumbnailBuffer = null;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const thumbnailUrl = `${frigate.url}/api/events/${event.id}/thumbnail.jpg`;
                    const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
                    thumbnailBuffer = Buffer.from(response.data);
                    logger.info(`Thumbnail fetched for event ${event.id} on attempt ${attempt}`);
                    break; // Success, exit the retry loop
                } catch (thumbnailError) {
                    if (attempt < maxRetries) {
                        logger.warn(`Failed to fetch thumbnail for event ${event.id} (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    } else {
                        logger.error(`Failed to fetch thumbnail for event ${event.id} after ${maxRetries} attempts. Event will not be sent.`);
                    }
                }
            }

            if (thumbnailBuffer) {
                telegram.sendPhoto(eventMessage, thumbnailBuffer, event.id);
                logger.info(`Event ${event.id} sent to Telegram`);
            } else {
                logger.error(`Skipping event ${event.id} - could not retrieve thumbnail`);
            }
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