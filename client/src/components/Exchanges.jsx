import React from 'react';
import numeral from 'numeral';

import EthereumService from '../services/domain/EthereumService';

import Icon from './common/Icon';
import Alert from './common/bulma/Alert';
import { EXCHANGE_POLLING_IN_SEC } from '../common/app-const';
import Flex from './common/glamorous/Flex';

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
        this._renderExchangeInfo = this._renderExchangeInfo.bind(this);
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
            <div>
                { this._renderExchangesInfo() }
            </div>
        );
    }

    _renderTable (config) {
        return (
            <Flex column hAlignCenter flex={1} flexShrink={0}>
                <h1 className="title is-size-5-mobile">
                    { config.title }
                </h1>
                <h2 className="subtitle">
                    { config.subtitle }
                </h2>
                <div className="m-left--x-mall m-right--x-small">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Exchange</th>
                                <th>Price</th>
                                <th>Change 24H</th>
                                <th>Volume 24H </th>
                                <th>Volume 24H To</th>
                            </tr>
                        </thead>
                        <tbody>
                            {config.data.map(this._renderExchangeInfo.bind(this, config.icons, config.decimalPlaces))}
                        </tbody>
                    </table>
                </div>
            </Flex>
        );
    }

    _renderExchangesInfo () {
        return (
            <Flex hAlignCenter flexWrap="wrap" flexShrink={0}>
                {
                    this._renderTable({
                        title        : 'ETH/USD',
                        subtitle     : 'By total volume',
                        data         : this.state.exchangesUSD,
                        icons        : {to: { icon: 'dollar-sign' }},
                        decimalPlaces: 2
                    })
                }
                {
                    this._renderTable({
                        title        : 'ETH/BTC',
                        subtitle     : 'By total volume',
                        data         : this.state.exchangesBTC,
                        icons        : {to: { icon: 'btc', prefix: 'fab' }},
                        decimalPlaces: 8
                    })
                }
            </Flex>

        );
    }

    _renderExchangeInfo (icons, decimalPlaces, exchange, index) {
        function __format (number, decimalPlaces) {
            if (!decimalPlaces) {
                return numeral(number).format('0,0');
            } else {
                let zeroes = '0';
                for (let i = 1; i < decimalPlaces; i++) {
                    zeroes = `${zeroes}0`;
                }
                return numeral(number).format(`0,0.${zeroes}`);
            }
        }

        let priceChangeClass = parseFloat(exchange.CHANGEPCT24HOUR) > 0
            ? 'has-text-success'
            : 'has-text-danger';

        return (
            <tr key={index}>
                <td>{exchange.MARKET}</td>
                <td><Flex><Icon icon={icons.to.icon} prefix={icons.to.prefix} />&nbsp;{__format(exchange.PRICE, decimalPlaces)}</Flex></td>
                <td className={priceChangeClass}><Flex><div>{__format(exchange.CHANGEPCT24HOUR, 2)}</div>&nbsp;<div>%</div></Flex></td>
                <td><Flex><Icon icon="ethereum" prefix="fab" />&nbsp;{__format(exchange.VOLUME24HOUR)}</Flex></td>
                <td><Flex><Icon icon={icons.to.icon} prefix={icons.to.prefix} />&nbsp;{__format(exchange.VOLUME24HOURTO)}</Flex></td>
            </tr>
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
                    exchangesUSD: exchangesInfos[0],
                    exchangesBTC: exchangesInfos[1],
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
