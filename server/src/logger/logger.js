
import log4js from 'log4js';
import loggerConfig from './log4js-config';
import ConfigService from '../services/config-service';

log4js.configure(loggerConfig, { cwd: ConfigService.getLogFilePath() });

const logger = process.env.NODE_ENV !== 'test'
    ? log4js.getLogger('main')
    : {
        info : () => {},
        debug: () => {},
        error: () => {},
        warn : () => {}
    };

export default logger;
