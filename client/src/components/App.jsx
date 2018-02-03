import React from 'react';
import { withRouter } from 'react-router-dom';
import { Flex } from './common/glamorous/Flex';
import Hero from './common/bulma/Hero';
import Footer from './common/bulma/Footer';
import EthereumService from '../services/domain/EthereumService';
import Icon from './common/Icon';
import Chart from './common/Chart';

const POLL_INTERVAL_IN_SECONDS = 2;

class App extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            blockchainInfo: null,
            priceInfo     : null
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
            <Flex
                column
                flex={1}
                flexShrink={0}
                justifyContent="space-between">
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
                <Flex hAlignCenter>
                    <Chart
                        height={400}
                        width={800}
                        legend="Pending TX (Last 3 Days)"
                        dataset={this.state.historicalBlockchainInfo}
                    />
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
                        {data.USD} {data.USD_delta >= 0
                            ? <small className="has-text-success">(+{data.USD_delta})</small>
                            : <small className="has-text-danger">({data.USD_delta})</small>}
                    </span>
                )
            },
            { stateKey: 'priceInfo', propKey: 'BTC', label: 'ETH/BTC', icon: 'btc', iconPrefix: 'fab' }
        ];
    }

    _renderLevel (level) {
        return (
            <nav className="level">
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
                this._setBlockchainState(results);
            })
            .catch(error => {
                console.log(error);
            });
    }

    _fetchBlockchainInfo () {
        return Promise.all([
            EthereumService.getBlockchainInfo(),
            EthereumService.getPriceInfo(),
            EthereumService.getHistoricalBlockchainInfo(3)
        ]);
    }

    _setBlockchainState (results, cb) {
        this.setState({
            blockchainInfo          : results[0],
            priceInfo               : results[1],
            historicalBlockchainInfo: results[2]
        }, cb);
    }
}

export default withRouter(App);
