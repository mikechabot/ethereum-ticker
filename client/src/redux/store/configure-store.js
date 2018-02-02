import NodeService from '../../services/common/node-service';

/**
 * Determine which Redux store to provide based on the
 * Environment Type of Node.js
 * @return {object}    Redux store
 */

export default NodeService.isProduction()
    ? require('./configure-store.prod').default
    : require('./configure-store.dev').default;
