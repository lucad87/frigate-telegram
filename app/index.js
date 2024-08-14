const logger = require('./logger.js');
const events = require('./processEvents.js');

// Function to process a single event
const handleSingleEvent = async (eventId) => {
    try {
        await events.processEvent(eventId);
    } catch (error) {
        logger.error('Error processing single event:', error);
    }
};

// Function to process multiple events
const handleMultipleEvents = async () => {
    try {
        await events.processEvents();
    } catch (error) {
        logger.error('Error processing multiple events:', error);
    }
};

// Single event example for testing
// const eventId = '1723532135.282072-4fccyg';
// handleSingleEvent(eventId);

// Multiple events example
setInterval(handleMultipleEvents, 60000); // poll every 60 seconds