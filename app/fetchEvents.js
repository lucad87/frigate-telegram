const axios = require('axios').default;
const logger = require('./logger.js');
const { getEpochTimestampFromSecondsAgo } = require('./utils.js');
const { withFrigateAuth } = require('./frigateAuth.js');
const { frigate, polling } = require('../config/settings.js').config;

const fetchEvents = async () => {
    try {
        const url = `${frigate.url}/api/events`;

        const params = {
            camera: frigate.camera,
            zones: frigate.zones,
            label: frigate.label,
            after: getEpochTimestampFromSecondsAgo(polling.interval)
        };

        // Frigate authenticates with a JWT (Bearer token), not with HTTP Basic auth
        const response = await withFrigateAuth((requestConfig) => axios.get(url, { ...requestConfig, params }));

        return response.data;
    } catch (error) {
        logger.warn('Cannot fetch events from Frigate', error);
    }
};

module.exports = { fetchEvents };