const { createLogger, format, transports } = require('winston');
const path = require('path');

const isDebug = process.env.DEBUG || 'false';

const logFilePath = path.join(__dirname, '../logs/app.log');

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
    ),
    transports: [
        new transports.File({ filename: logFilePath }),
        new transports.Console() // Add this line to log to the console
    ]
});

const originalInfo = logger.info;

logger.info = function (message) {
    if (process.env.DEBUG === 'true') {
        originalInfo.call(logger, message);
    }
};

module.exports = logger;