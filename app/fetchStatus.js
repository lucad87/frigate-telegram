const axios = require('axios').default;
const logger = require('./logger.js');
const { frigate } = require('../config/settings.js').config;

const fetchFrigateStatus = async () => {
    try {
        const url = `${frigate.url}/api/version`;

        const axiosConfig = {};
        
        // Add authentication if credentials are provided
        if (frigate.username && frigate.password) {
            axiosConfig.auth = {
                username: frigate.username,
                password: frigate.password
            };
        }

        const response = await axios.get(url, axiosConfig);

        return response.status;
    } catch (error) {
        logger.warn('Cannot fetch Frigate status', error);
    }
};

module.exports = { fetchFrigateStatus };