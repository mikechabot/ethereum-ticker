import EthereumAPIService from '../services/ethereum-api-service';
import {ALLOWED_HOURS_BACK, ALLOWED_TIME_BASIS} from '../../common/app-const';
import PollingService from '../../services/polling-service';

const EthereumAPIController = {
    handleGetTopVolumeTo (request, response, next) {
        EthereumAPIService
            .getCurrentTopVolumeToFromCache()
            .then(data => response.json(data))
            .catch(error => next(error));
    },
    handleGetExchangeInfo (request, response, next) {
        EthereumAPIService
            .getCurrentExchangeInfoFromCache()
            .then(data => response.json(data))
            .catch(error => next(error));
    },
    handleGetNextStatisticsDate (request, response, next) {
        return response.json(
            PollingService
                .getNextStatisticsDate()
        );
    },
    handleGetCurrentBlockchainInfo (request, response, next) {
        EthereumAPIService
            .getLatestBlockchainInfoFromDisk()
            .then(data => response.json(data))
            .catch(error => next(error));
    },
    handleGetCurrentPriceInfo (request, response, next) {
        EthereumAPIService
            .getLatestPriceInfoFromDisk()
            .then(data => response.json(data))
            .catch(error => next(error));
    },
    handleGetHistoricalBlockchainInfo (request, response, next) {
        const { query } = request;
        if (!query || !query.hoursBack || !query.timeBasis) {
            return next(new Error('Missing required params'));
        }
        const { hoursBack, timeBasis } = query;

        if (!ALLOWED_HOURS_BACK.includes(hoursBack)) {
            return next(new Error('Invalid hoursBack query'));
        }
        if (!ALLOWED_TIME_BASIS.includes(timeBasis)) {
            return next(new Error('Invalid time basis query'));
        }

        EthereumAPIService
            .getHistoricalBlockchainInfoFromCache(hoursBack, timeBasis)
            .then(data => response.json(data))
            .catch(error => next(error));
    },
    handleGetHistoricalPriceInfo (request, response, next) {
        const { query } = request;
        if (!query || !query.hoursBack || !query.timeBasis) {
            return next(new Error('Missing required params'));
        }
        const { hoursBack, timeBasis } = query;

        if (!ALLOWED_HOURS_BACK.includes(hoursBack)) {
            return next(new Error('Invalid hoursBack query'));
        }
        if (!ALLOWED_TIME_BASIS.includes(timeBasis)) {
            return next(new Error('Invalid time basis query'));
        }

        EthereumAPIService
            .getHistoricalPriceInfoLastNDays(hoursBack, timeBasis)
            .then(data => response.json(data))
            .catch(error => next(error));
    }
};

export default EthereumAPIController;
