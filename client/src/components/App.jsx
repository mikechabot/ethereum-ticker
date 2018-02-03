import React from 'react';
import { withRouter } from 'react-router-dom';
import { Flex } from './common/glamorous/Flex';
import Hero from './common/bulma/Hero';
import Footer from './common/bulma/Footer';
import EthereumService from '../services/domain/EthereumService';
import Icon from './common/Icon';

const POLL_INTERVAL_IN_SECONDS = 30;

class App extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            blockchainInfo: null,
            priceInfo     : null,
            pendingDelta  : -1
        };
        this._loadBlockchainInfo = this._loadBlockchainInfo.bind(this);
        this.interval = null;
    }

    componentDidMount () {
        this._fetchBlockchainInfo()
            .then(results => {
                this._setBlockchainState(results, () => {
                    this.interval = window.setInterval(this._loadBlockchainInfo, POLL_INTERVAL_IN_SECONDS * 1000);
                });
            })
            .catch(error => {
                console.log(error);
            });
    }

    componentWillUnmount () {
        if (this.interval) {
            window.clearInterval(this.interval);
            this.interval = undefined;
        }
    }

    render () {
        if (!this.state.blockchainInfo) {
            return <span />;
        }
        return (
            <Flex column flex={1} flexShrink={0} justifyContent="space-between">
                <div>
                    <Hero
                        theme="dark"
                        title="Ethereum Ticker"
                        subtitle="Data-driven insights on the Ethereum blockchain"
                        icon="ethereum"
                        iconPrefix="fab"
                    />
                </div>
                <div className="m-top--small">
                    { this._renderLevel(this._getLevel1()) }
                </div>
                <Flex flex={1}>
                    hey
                </Flex>
                <div>
                    <Footer />
                </div>
            </Flex>
        );
    }

    _getLevel1 () {
        return [
            {
                stateKey       : 'blockchainInfo',
                label          : 'Pending Txs',
                getValueFromRaw: data => (
                    <span>
                        <Icon icon="hourglass-start" prefix="fas" />&nbsp;
                        {data.unconfirmed_count} {data.pendingTxDelta >= 0
                            ? <small className="has-text-success">(+{data.pendingTxDelta})</small>
                            : <small className="has-text-danger">({data.pendingTxDelta})</small>}
                    </span>
                )
            },
            {
                stateKey       : 'priceInfo',
                label          : 'ETH/USD',
                getValueFromRaw: data => (
                    <span>
                        <Icon icon="dollar-sign" />&nbsp;
                        {data.price_usd} {data.price_usd_delta >= 0
                            ? <small className="has-text-success">(+{data.price_usd_delta})</small>
                            : <small className="has-text-danger">({data.price_usd_delta})</small>}
                    </span>
                )
            },
            { stateKey: 'priceInfo', propKey: 'price_btc', label: 'ETH/BTC', icon: 'btc', iconPrefix: 'fab' }
        ];
    }

    _renderLevel (level) {
        return (
            <nav className="level is-mobile">
                { level.map((item, index) => {
                    let value = this.state[item.stateKey];
                    if (item.getValueFromRaw) {
                        value = item.getValueFromRaw(value);
                    } else {
                        if (item.propKey) {
                            value = value[item.propKey];
                        }
                        if (item.getValue) {
                            value = item.getValue(value);
                        }
                    }

                    return (
                        <div key={index} className="level-item has-text-centered">
                            <div>
                                <p className="heading">{item.label}</p>
                                <p className="title">
                                    {
                                        item.icon
                                            ? (
                                                <span>
                                                    <Icon icon={item.icon} prefix={item.iconPrefix} />&nbsp;
                                                </span>
                                            )
                                            : null
                                    }
                                    {value}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </nav>
        );
    }

    _loadBlockchainInfo () {
        this._fetchBlockchainInfo()
            .then(results => {
                console.log(results[0]);
                if (!this.state.blockchainInfo || results[0]._id !== this.state.blockchainInfo._id) {
                    this._setBlockchainState(results);
                }
            })
            .catch(error => {
                console.log(error);
            });
    }

    _fetchBlockchainInfo () {
        return Promise.all([EthereumService.getBlockchainInfo(), EthereumService.getPriceInfo()]);
    }
    _setBlockchainState (results, cb) {
        this.setState({
            blockchainInfo: results[0],
            priceInfo     : results[1],
            pendingDelta  : this.state.pendingDelta === -1
                ? 0
                : results[0].unconfirmed_count - this.state.blockchainInfo.unconfirmed_count
        }, cb);
    }
}

export default withRouter(App);
