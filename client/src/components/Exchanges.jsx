import React from 'react';

import EthereumService from '../services/domain/EthereumService';

import Icon from './common/Icon';
import Alert from './common/bulma/Alert';
import { EXCHANGE_POLLING_IN_SEC } from '../common/app-const';

class Exchanges extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            isFetching  : true,
            exchangesBTC: null,
            exchangesUSD: null,
            error       : null
        };
        this._loadData = this._loadData.bind(this);
        this._tryAgain = this._tryAgain.bind(this);
        this.interval = null;
    }

    componentDidMount () {
        this._loadData();
    }

    render () {
        if (this.state.isFetching) {
            return (
                <div className="has-text-centered">
                    <span>
                        <i className="fas fa-cog fa-spin fa-5x" />
                    </span>
                </div>
            );
        }
        if (this.state.error) {
            return (
                <Alert
                    className="is-danger"
                    onClick={this._tryAgain}
                    content={(
                        <span>
                        Unable to fetch exchange data.&nbsp;<a href="javascript:void(0);" onClick={this._tryAgain}>Try again?</a>
                        </span>
                    )}
                    icon="exclamation-triangle"
                />
            );
        }
        return (
            <div className="columns">
                <div className="column">
                    <h1 className="title is-size-5-mobile">
                        ETH/USD
                    </h1>
                    <div>
                        {this.state.exchangesUSD.map((exchange, index) => (
                            <div className="box" key={exchange.name}>
                                <div>
                                    <strong className="has-text-info">{exchange.exchange}</strong>
                                </div>
                                <div>
                                    Volume 24h: <Icon icon="ethereum" prefix="fab" />&nbsp;{exchange.volume24h.toFixed(2)}
                                </div>
                                <div>
                                    Volume 24h To: <Icon icon="dollar-sign" />&nbsp;{(exchange.volume24hTo / 1000000).toFixed(2) } M
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="column">
                    <h1 className="title">
                        ETH/BTC
                    </h1>
                    <div>
                        {this.state.exchangesBTC.map((exchange, index) => (
                            <div className="box" key={exchange.name}>
                                <div>
                                    <strong className="has-text-info">{exchange.exchange}</strong>
                                </div>
                                <div>
                                    Volume 24h: <Icon icon="ethereum" prefix="fab" />&nbsp;{exchange.volume24h.toFixed(2)}
                                </div>
                                <div>
                                    Volume 24h To: <Icon icon="btc" prefix="fab" />&nbsp;{exchange.volume24hTo.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    _loadData (silent) {
        this._loadExchangeInfo(silent);
    }

    _loadExchangeInfo (silent) {
        this.setState({
            isFetching: !silent
        }, this._getAndSetExchangeInfo);
    }

    _getAndSetExchangeInfo () {
        EthereumService
            .getExchangesInfos()
            .then(exchangesInfos => {
                this.setState({
                    exchangesUSD: exchangesInfos[0].Data,
                    exchangesBTC: exchangesInfos[1].Data,
                    isFetching  : false
                }, () => {
                    if (!this.interval) {
                        this.interval = window.setInterval(this._loadExchangeInfo.bind(this, true), EXCHANGE_POLLING_IN_SEC * 1000);
                    }
                });
            })
            .catch(error => {
                this.setState({ error: true, isFetching: false });
                console.log(error);
            });
    }

    _tryAgain () {
        if (this.interval) {
            window.clearInterval(this.interval);
            this.interval = null;
        }
        this.setState({
            error     : false,
            isFetching: true
        }, this._loadData);
    }
}

export default Exchanges;
