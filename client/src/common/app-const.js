
import React from 'react';
import Icon from '../components/common/Icon';

export const ENTITY_KEY = {
    FOO: 'foo',
    BAR: 'bar',
    BAZ: 'baz'
};

export const INITIAL_STATE = {
    entities: {
        [ENTITY_KEY.FOO]: {},
        [ENTITY_KEY.BAR]: {},
        [ENTITY_KEY.BAZ]: {}

    },
    counter: 0
};

export const PRICE_POLLING_INTERVAL_IN_SEC = 5;
export const BLOCKCHAIN_POLLING_INTERVAL_IN_SEC = 30;

export const HOURS_MENU = [
    { label: '1H', key: 1 }, { label: '3H', key: 3 },
    { label: '6H', key: 6 }, { label: '12H', key: 12 },
    { label: '1D', key: 24 }, { label: '3D', key: 24 * 3 },
    { label: '7D', key: 24 * 7 }, { label: '30D', key: 24 * 30 }
];
export const TIME_INTERVAL = [{ label: 'Hr', key: 'hour' }, { label: 'Min', key: 'minute' }];

export const PRICE_LEVEL_CONFIG = [
    {
        pendingKey     : 'isFetchingBlockchain',
        stateKey       : 'blockchainInfo',
        label          : 'Pending Txs',
        propKey        : 'unconfirmed_count',
        icon           : 'hourglass-start',
        iconPrefix     : 'fas',
        getValueFromRaw: data => (
            <span>
                {data.unconfirmed_count} {data.pendingTxDelta >= 0
                    ? <small className="has-text-success">(+{data.pendingTxDelta})</small>
                    : <small className="has-text-danger">({data.pendingTxDelta})</small>}
            </span>
        )
    },
    {
        pendingKey     : 'isFetchingPrice',
        stateKey       : 'priceInfo',
        propKey        : 'USD',
        label          : 'ETH/USD',
        icon           : 'dollar-sign',
        getValueFromRaw: data => (
            <span>
                {data.USD} {data.USD_delta >= 0
                    ? <small className="has-text-success">(+{data.USD_delta})</small>
                    : <small className="has-text-danger">({data.USD_delta})</small>}
            </span>
        )
    },
    {
        pendingKey: 'isFetchingPrice',
        stateKey  : 'priceInfo',
        propKey   : 'BTC',
        label     : 'ETH/BTC',
        icon      : 'btc',
        iconPrefix: 'fab'
    }
];
