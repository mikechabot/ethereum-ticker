import React from 'react';
import { withRouter } from 'react-router-dom';
import { Flex } from './common/glamorous/Flex';
import Hero from './common/bulma/Hero';
import Footer from './common/bulma/Footer';
import EthereumService from '../services/domain/EthereumService';
import Icon from './common/Icon';
import MixedChart from './common/MixedChart';

const POLL_INTERVAL_IN_SECONDS = 10;

class App extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            blockchainInfo: null,
            priceInfo     : null
        };
        this._loadData = this._loadData.bind(this);
        this._getAndSetPriceInfo = this._getAndSetPriceInfo.bind(this);
        this._getAndSetBlockchainInfo = this._getAndSetBlockchainInfo.bind(this);
        this._getAndSetChartInfo = this._getAndSetChartInfo.bind(this);
        this._tryAgain = this._tryAgain.bind(this);
        this.interval = null;
    }

    componentDidMount () {
        this._loadData();
    }

    componentWillUnmount () {
        if (this.interval) {
            window.clearInterval(this.interval);
            this.interval = undefined;
        }
    }

    render () {
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
                {
                    this.state.error
                        ? (
                            <Flex hAlignCenter className="notification is-danger">
                                <button
                                    className="delete"
                                    onClick={this._tryAgain}
                                />
                                Something went wrong. I'm sure we're looking into it.&nbsp;<a href="javascript:void(0);" onClick={this._tryAgain}>Try again?</a>
                            </Flex>
                        )
                        : null
                }
                <div className="m-top--small">
                    {
                        this.state.priceInfo
                            ? this._renderLevel(this._getLevel1())
                            : null
                    }
                </div>
                <Flex hAlignCenter flexShrink={0}>
                    {
                        this.state.isFetchingChartInfo
                            ? (
                                <Flex hAlignCenter>
                                    <i className="fas fa-cog fa-spin fa-5x" />
                                </Flex>
                            )
                            : null
                    }
                    {
                        this.state.historicalBlockchainInfo
                            ? (
                                <MixedChart
                                    height={400}
                                    width={800}
                                    legend="Pending TX (Last 3 Days)"
                                    datasets={[
                                        {
                                            label: 'Pending TX',
                                            data : this.state.historicalBlockchainInfo
                                        },
                                        {
                                            label: 'ETH/USD',
                                            data : this.state.historicalPriceInfo
                                        }
                                    ]}
                                />
                            )
                            : null
                    }
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
                pendingKey     : 'isFetchingBlockchain',
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
                pendingKey     : 'isFetchingPrice',
                stateKey       : 'priceInfo',
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
    }

    _renderLevel (level) {
        return (
            <nav className="level">
                { level.map((item, index) => {
                    let value = this.state[item.stateKey];
                    if (this.state[item.pendingKey]) {
                        value = <i className="fas fa-cog fa-spin" />;
                    } else {
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

    _tryAgain () {
        this.setState({
            error     : false,
            isFetching: true
        }, this._loadBlockchainInfo);
    }

    _loadData (silent) {
        this._loadPriceInfo(silent);
        this._loadBlockchainInfo(silent);
        this._loadChartInfo(silent);

        // this._fetchBlockchainInfo()
        //     .then(results => {
        //         this._setBlockchainState(results);
        //     })
        //     .catch(error => {
        //         this.setState({ error: true, isFetching: false });
        //         console.log(error);
        //     });
    }

    _loadPriceInfo (silent) {
        this.setState({
            isFetchingPrice: !silent
        }, this._getAndSetPriceInfo);
    }

    _loadBlockchainInfo (silent) {
        this.setState({
            isFetchingBlockchain: !silent
        }, this._getAndSetBlockchainInfo);
    }

    _loadChartInfo (silent) {
        this.setState({
            isFetchingChartInfo: !silent
        }, () => this._getAndSetChartInfo(
            () => {
                if (!this.interval) {
                    this.interval = window.setInterval(() => this._loadData(true), POLL_INTERVAL_IN_SECONDS * 1000);
                }
            }
        ));
    }

    _getAndSetPriceInfo () {
        EthereumService
            .getPriceInfo()
            .then(priceInfo => {
                this.setState({
                    priceInfo,
                    isFetchingPrice: false
                });
            })
            .catch(error => {
                this.setState({ error: true, isFetchingPrice: false });
                console.log(error);
            });
    }

    _getAndSetBlockchainInfo () {
        EthereumService
            .getBlockchainInfo()
            .then(blockchainInfo => {
                this.setState({
                    blockchainInfo,
                    isFetchingBlockchain: false
                });
            })
            .catch(error => {
                this.setState({ error: true, isFetchingBlockchain: false });
                console.log(error);
            });
    }

    _getAndSetChartInfo (cb) {
        Promise
            .all([
                EthereumService.getHistoricalBlockchainInfo(3),
                EthereumService.getHistoricalPriceInfo(3)
            ])
            .then(values => {
                this.setState({
                    historicalBlockchainInfo: values[0],
                    historicalPriceInfo     : values[1],
                    isFetchingChartInfo     : false
                }, cb);
            })
            .catch(error => {
                this.setState({ error: true, isFetchingChartInfo: false });
                console.log(error);
            });
    }
}

export default withRouter(App);
