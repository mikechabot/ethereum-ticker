import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import _isString from 'lodash/isString';

import logger from '../logger/logger';
import ConfigService from './config-service';

const MAX_PAYLOAD_SIZE = '50mb';

const StartupService = {
    startApp () {
        logger.info('Starting xg-app-server');
        return new Promise((resolve, reject) => {
            this.initConfiguration()
                .then(this.configureMongoose)
                .then(this.verifyDatabaseConnectivity)
                .then(this.configureExpress)
                .then((application) => {
                    logger.info('Startup complete');
                    resolve(application);
                })
                .catch(error => reject(error));
        });
    },
    initConfiguration () {
        return new Promise((resolve, reject) => {
            try {
                const appConfig = ConfigService.getConfig();
                // logger.info('Listing application configuration');
                // logger.info('=================================');
                // for (let prop in appConfig) {
                //     if (appConfig.hasOwnProperty(prop)) {
                //         logger.info(`${prop}: ${JSON.stringify(appConfig[prop])}`);
                //     }
                // }
                // logger.info('=================================');
                return resolve();
            } catch (error) {
                return reject(error);
            }
        });
    },
    configureMongoose () {
        return new Promise((resolve) => {
            logger.info('Starting mongoose configuration');

            // Set Mongoose promise library
            mongoose.Promise = global.Promise;

            // Configure plugins
            const plugins = [
                { description: 'Domain Properties', path: '../mongoose/plugin/domain-properties' }
            ];

            logger.info(`Configuring ${plugins.length} Mongoose plugins`);
            plugins.forEach(plugin => {
                logger.info(`Attaching ${plugin.description} plugin`);
                mongoose.plugin(require(plugin.path));
            });

            logger.info('Importing Mongoose Schemas');
            require('../mongoose/schemas');

            logger.info('Completed mongoose configuration');
            resolve();
        });
    },
    verifyDatabaseConnectivity () {
        const MONGO_URL = ConfigService.getMongoUrl();
        logger.info(`Attempting connection to ${MONGO_URL}`);
        return new Promise((resolve, reject) => {
            mongoose
                .connect(MONGO_URL, {useMongoClient: true})
                .then(
                    () => {
                        _getMongoDbVersion()
                            .then(resolve)
                            .catch(error => {
                                reject(error);
                            });
                    },
                    (error) => reject(error)
                );
        });
    },
    configureExpress () {
        return new Promise((resolve) => {
            const application = express();

            application.use(morgan('combined', {
                stream: { write: str => logger.info(str) }
            }));

            const whitelist = ConfigService.getWhitelist();

            const corsInstance = cors({
                origin: (origin, callback) => {
                    if (!origin || whitelist.indexOf(origin) !== -1) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                }
            });

            application.use(corsInstance);

            application.disable('X-Powered-By');
            application.set('etag', false);

            application.use(bodyParser.json({ limit: MAX_PAYLOAD_SIZE }));
            application.use(bodyParser.urlencoded({ extended: false, limit: MAX_PAYLOAD_SIZE }));

            [
                {
                    key       : 'eth',
                    controller: '../api/controllers/ethereum-api-controller',
                    routes    : '../api/routes/ethereum-api-routes'
                }
            ]
            .map(resource => {
                const routes = require(resource.routes).default;
                const controller = require(resource.controller).default;
                routes.configure(application, controller);
            });

            application.use((req, res, next) => {
                const error = new Error('Not Found: ' + req.originalUrl);
                error.status = 404;
                return next(error);
            });

            application.use((error, req, res, next) => {
                logger.error('Error occurred in route : ' + req.originalUrl);
                logger.error(error);
                const respBody = _isString(error) ? error : error.message;
                res.status(error.status || 500);
                res.json(respBody);
            });

            http
                .createServer(application)
                .listen(
                    ConfigService.getPort(),
                    () => {
                        logger.info(`Express started. Listening on ${ConfigService.getPort()}`);
                        _startBlockchainPolling();
                    }
                );
        });
    }
};

function _startBlockchainPolling () {
    const EthereumAPIService = require('../api/services/ethereum-api-service').default;
    logger.info('Starting polling in 5 seconds...');
    setTimeout(() => {
        EthereumAPIService.startPolling();
    }, 5000);
}

function _getMongoDbVersion () {
    return new Promise((resolve, reject) => {
        const mongoAdmin = new mongoose.mongo.Admin(getDb());
        return mongoAdmin.buildInfo((error, info) => {
            if (error) {
                reject(error);
            } else {
                logger.info(`Successfully connected to MongoDB v${info.version}`);
                resolve();
            }
        });
    });
}

function getConnection () {
    return mongoose.connection;
}

function getDb () {
    return getConnection().db;
}

module.exports = StartupService;
