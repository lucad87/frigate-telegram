const axios = require('axios');
const config = require('../config/config.js');
const logger = require('./logger.js');


const frigateUrl = config.frigateUrl;

logger.info(`Frigate API URL: ${frigateUrl}`);

const fetchSingleEvent = async (eventId) => {
    try {
        const response = await axios.get(`${frigateUrl}/api/events/${eventId}`);

        if (response && response !== '') {
            logger.info(`Fetched the event ${eventId} from Frigate`);
        }

        return response.data;
    } catch (error) {
        logger.error('Error fetching the event from Frigate:', error);
        throw new Error('Error fetching the event from Frigate:', error);
    }
};

const fetchMultipleEvents = async () => {
    try {
        const actual_dateTime = Date.now();
        const after_value = Math.floor((actual_dateTime - 60000) / 1000) // 60 seconds ago

        const response = await axios.get(`${frigateUrl}/api/events?camera=${config.camera}&zones=${config.zones}&label=${config.label}&after=${after_value}`);

        if (response && response !== '' && response.data && response.data.length > 0) {
            logger.info(`Fetched an event from Frigate`);
        }

        return response.data;
    } catch (error) {
        logger.error('Error fetching events from Frigate:', error);
        throw new Error('Error fetching events from Frigate:', error);
    }
};

module.exports = { fetchMultipleEvents, fetchSingleEvent };