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
            
            // Fetch both the thumbnail and preview GIF from Frigate
            // Retry a few times in case they are not immediately available
            const axios = require('axios');
            const maxRetries = 3;
            const retryDelay = 1000; // 1 second
            let thumbnailBuffer = null;
            let previewBuffer = null;

            // Setup axios config with authentication if credentials are provided
            const axiosConfig = { 
                responseType: 'arraybuffer'
            };
            
            if (frigate.username && frigate.password) {
                axiosConfig.auth = {
                    username: frigate.username,
                    password: frigate.password
                };
            }

            // Fetch thumbnail
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const thumbnailUrl = `${frigate.url}/api/events/${event.id}/thumbnail.jpg`;
                    const response = await axios.get(thumbnailUrl, axiosConfig);
                    thumbnailBuffer = Buffer.from(response.data);
                    logger.info(`Thumbnail fetched for event ${event.id} on attempt ${attempt}`);
                    break; // Success, exit the retry loop
                } catch (thumbnailError) {
                    if (attempt < maxRetries) {
                        logger.warn(`Failed to fetch thumbnail for event ${event.id} (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    } else {
                        logger.error(`Failed to fetch thumbnail for event ${event.id} after ${maxRetries} attempts.`, thumbnailError);
                    }
                }
            }

            // Fetch preview GIF
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const previewUrl = `${frigate.url}/api/events/${event.id}/preview.gif`;
                    const response = await axios.get(previewUrl, axiosConfig);
                    previewBuffer = Buffer.from(response.data);
                    logger.info(`Preview GIF fetched for event ${event.id} on attempt ${attempt}`);
                    break; // Success, exit the retry loop
                } catch (previewError) {
                    if (attempt < maxRetries) {
                        logger.warn(`Failed to fetch preview for event ${event.id} (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    } else {
                        logger.error(`Failed to fetch preview for event ${event.id} after ${maxRetries} attempts.`, previewError);
                    }
                }
            }

            // Send based on what we successfully fetched
            if (thumbnailBuffer && previewBuffer) {
                await telegram.sendPhotoAndAnimation(eventMessage, thumbnailBuffer, previewBuffer, event.id);
                logger.info(`Event ${event.id} sent to Telegram with thumbnail and preview GIF`);
            } else if (previewBuffer) {
                telegram.sendAnimation(eventMessage, previewBuffer, event.id);
                logger.info(`Event ${event.id} sent to Telegram with preview GIF only`);
            } else if (thumbnailBuffer) {
                telegram.sendPhoto(eventMessage, thumbnailBuffer, event.id);
                logger.info(`Event ${event.id} sent to Telegram with thumbnail only`);
            } else {
                logger.warn(`Could not retrieve any media for event ${event.id}. Sending text-only notification.`);
                telegram.sendMessage(eventMessage, event.id);
                logger.info(`Event ${event.id} sent to Telegram without media`);
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