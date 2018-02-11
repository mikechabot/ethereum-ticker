import SortableMap from 'sortable-map';
import logger from '../logger/logger';

const __cache = new SortableMap();

let svc = {};
const CacheService = svc = {
    __cache,
    add (key, obj) {
        logger.info(`CACHE: Adding ${key}`);
        svc.__cache.add(key, obj);
    },
    has (key) {
        return svc.__cache.has(key);
    },
    find (key) {
        logger.info(`CACHE: Fetching ${key}`)
        return svc.__cache.find(key);
    },
    delete (key) {
        logger.info(`CACHE: Deleting ${key}`);
        return !!svc.__cache.delete(key);
    },
    deleteAndAdd (key, obj) {
        svc.deleteIfPresent(key);
        svc.add(key, obj);
    },
    deleteIfPresent (key) {
        if (svc.has(key)) {
            svc.delete(key);
        }
    }
};

export default CacheService;
