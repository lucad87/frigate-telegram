const logger = require('./logger.js');
const events = require('./processEvents.js');

function pollEvents() {
    try {
        logger.info('Starting event polling...');
        events.processEvents();
        logger.info('Event polling completed successfully.');
    } catch (error) {
        logger.error('Error occurred during event polling:', error);
    }
}

setInterval(pollEvents, 60000); // poll every 60 seconds