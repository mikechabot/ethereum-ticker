import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import _isString from 'lodash/isString';

import logger from '../logger/logger';
import ConfigService from './config-service';

const MAX_PAYLOAD_SIZE = '50mb';

const StartupService = {
    startApp () {
        return new Promise((resolve, reject) => {
            this.__initConfiguration()
                .then(this.__configureMongoose)
                .then(this.__verifyDatabaseConnectivity)
                .then(this.__configureExpress)
                .then((application) => {
                    resolve(application);
                })
                .catch(error => reject(error));
        });
    },
    __initConfiguration () {
        return new Promise((resolve, reject) => {
            try {
                Object.keys(ConfigService).forEach(key => {
                    const prop = ConfigService[key];
                    if (typeof prop === 'function') {
                        prop();
                    }
                });
                return resolve();
            } catch (error) {
                return reject(error);
            }
        });
    },
    __configureMongoose () {
        return new Promise((resolve) => {
            // Set Mongoose promise library
            mongoose.Promise = global.Promise;

            // Configure plugins
            const plugins = [
                { description: 'Domain Properties', path: '../mongoose/plugin/domain-properties' }
            ];

            plugins.forEach(plugin => {
                mongoose.plugin(require(plugin.path));
            });

            require('../mongoose/schemas');
            resolve();
        });
    },
    __verifyDatabaseConnectivity () {
        const MONGO_URL = ConfigService.getMongoUrl();
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
    __configureExpress () {
        return new Promise((resolve) => {
            const application = express();

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
                        resolve();
                    }
                );
        });
    }
};

function _getMongoDbVersion () {
    return new Promise((resolve, reject) => {
        const mongoAdmin = new mongoose.mongo.Admin(getDb());
        return mongoAdmin.buildInfo((error, info) => {
            if (error) {
                reject(error);
            } else {
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
