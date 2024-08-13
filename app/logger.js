const { createLogger, format, transports } = require('winston');
const path = require('path');


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

module.exports = logger;