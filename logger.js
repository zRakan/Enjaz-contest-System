import winston from "winston";
import morgan from "morgan";

const winstonLogger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: './logs/requests.log',
            maxsize: 15 * 1024 * 1024, // 15MB
            maxFiles: 5,
            colorize: false
        })
    ],

    exitOnError: false
});

// Create Token for body content
morgan.token('body', function(req) {
    return JSON.stringify(req.body)
});

export const logger = morgan('(:response-time ms) :remote-addr - :remote-user [:date[clf]] ":method :url [:body] HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', { 
    stream: { write: (message) => winstonLogger.info(message) }
}); 