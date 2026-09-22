const axios = require('axios').default;
const logger = require('./logger.js');
const { withFrigateAuth } = require('./frigateAuth.js');
const { frigate } = require('../config/settings.js').config;

const fetchFrigateStatus = async () => {
    try {
        const url = `${frigate.url}/api/version`;

        // Frigate authenticates with a JWT (Bearer token), not with HTTP Basic auth
        const response = await withFrigateAuth((requestConfig) => axios.get(url, requestConfig));

        return response.status;
    } catch (error) {
        logger.warn('Cannot fetch Frigate status', error);
    }
};

module.exports = { fetchFrigateStatus };