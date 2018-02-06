import React from 'react';
import Maybe from 'maybe-baby';
import { withRouter } from 'react-router-dom';
import Hero from './common/bulma/Hero';
import Footer from './common/bulma/Footer';
import EthereumService from '../services/domain/EthereumService';
import Icon from './common/Icon';
import CandlestickChart from './common/CandlestickChart';
import PriceLevel from './PriceLevel';
import Alert from './common/bulma/Alert';
import {Flex} from './common/glamorous/Flex';

const POLL_INTERVAL_IN_SECONDS = 10;
const DAYS_BACK = [1, 3, 7];
const TIME_BASIS = ['hour', 'minute'];

class App extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            daysBack                : 1,
            timeBasis               : 'hour',
            isFetching              : true,
            historicalBlockchainInfo: null,
            historicalPriceInfo     : null
        };
        this._loadData = this._loadData.bind(this);
        this._getAndSetChartInfo = this._getAndSetChartInfo.bind(this);
        this._tryAgain = this._tryAgain.bind(this);
        this.interval = null;
    }

    componentDidMount () {
        this._loadData(false);
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
                { this._renderHeader() }
                <div className="m-top--large">
                    <PriceLevel />
                </div>
                <div className="m-large" style={{height: '100%'}}>
                    { this._renderChart() }
                </div>
                <div>
                    <Footer />
                </div>
            </Flex>
        );
    }

    _renderHeader () {
        return (
            <div>
                <Hero
                    link="http://marketmovers.io"
                    theme="dark"
                    title="marketmovers.io"
                    subtitle="Data-driven insights on the Ethereum blockchain"
                    icon="ethereum"
                    iconPrefix="fab"
                />
            </div>
        );
    }

    _renderChart () {
        if (this.state.isFetching) {
            return (
                <div className="has-text-centered" style={{height: '100%'}}>
                    <Icon icon="cog fa-spin fa-5x" prefix="fas" />
                </div>
            );
        }
        if (this.state.error) {
            return (
                <div style={{height: '100%'}}>
                    <Alert
                        className="is-danger"
                        onClick={this._tryAgain}
                        content={(
                            <span>
                                Unable to fetch historical data.&nbsp;<a href="javascript:void(0);" onClick={this._tryAgain}>Try again?</a>
                            </span>
                        )}
                        icon="exclamation-triangle"
                    />
                </div>

            );
        }
        if (this.state.isCachingBlockchainInfo || this.state.isCachingPriceInfo) {
            return (
                <Alert
                    className="is-info"
                    onClick={this._tryAgain}
                    content={(
                        <span>
                        Generating a fresh report, please wait.&nbsp;<a href="javascript:void(0);" onClick={this._tryAgain}>Try again?</a>
                        </span>
                    )}
                    icon="info-circle"
                />
            );
        }
        return (
            <div style={{height: '100%'}}>
                <Flex justifyContent="space-between">
                    { this._renderDaysBackButtons() }
                    { this._renderTimeBasis() }
                </Flex>
                <CandlestickChart
                    id="eth-usd-chart"
                    height={600}
                    legend="Pending Txs vs ETH/USD"
                    yAxis={{
                        includeZero    : false,
                        prefix         : '$',
                        title          : 'Price',
                        labelFontSize  : 12,
                        labelFontFamily: 'Inconsolata',
                        titleFontSize  : 20,
                        titleFontFamily: 'Inconsolata',
                        crosshair      : {
                            enabled: true
                        }
                    }}
                    yAxis2={{
                        title          : 'Pending Txs',
                        includeZero    : false,
                        tickLength     : 0,
                        labelFontSize  : 12,
                        labelFontFamily: 'Inconsolata',
                        titleFontSize  : 20,
                        titleFontFamily: 'Inconsolata',
                        crosshair      : {
                            enabled: true
                        }
                    }}
                    datasets={[
                        {
                            type              : 'candlestick',
                            label             : 'ETH/USD',
                            data              : this.state.historicalPriceInfo,
                            yValueFormatString: '$#,##0.00',
                            xValueFormatString: 'MMM-DD hTT K'
                        },
                        {
                            type              : 'line',
                            showInLegend      : true,
                            label             : 'Pending Txs',
                            axisYType         : 'secondary',
                            xValueFormatString: 'MMM-DD hTT K',
                            data              : this.state.historicalBlockchainInfo
                        }
                    ]}

                />
            </div>
        );
    }

    _renderDaysBackButtons () {
        return (
            <div className="buttons has-addons">
                {
                    DAYS_BACK.map(dayBack => {
                        return (
                            <span key={dayBack} onClick={() => {
                                if (this.state.daysBack !== dayBack) {
                                    this.setState({daysBack: dayBack}, () => this._fetchNewData());
                                }
                            }} className={`button ${this.state.daysBack === dayBack ? 'is-dark is-selected' : ''}`}>{dayBack} day
                            </span>
                        );
                    })
                }
            </div>
        );
    }

    _renderTimeBasis () {
        return (
            <div className="buttons has-addons">
                {
                    TIME_BASIS.map(timeBasis => {
                        return (
                            <span key={timeBasis} onClick={() => {
                                if (this.state.timeBasis !== timeBasis) {
                                    this.setState({timeBasis: timeBasis}, () => this._fetchNewData());
                                }
                            }} className={`button ${this.state.timeBasis === timeBasis ? 'is-dark is-selected' : ''}`}>
                                {timeBasis}
                            </span>
                        );
                    })
                }
            </div>
        );
    }

    _fetchNewData () {
        this._tryAgain();
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

    _loadData (silent) {
        this._loadChartInfo(silent);
    }

    _loadChartInfo (silent) {
        this.setState({
            isFetching: !silent
        }, () => this._getAndSetChartInfo());
    }

    _getAndSetChartInfo (cb) {
        Promise
            .all([
                EthereumService.getHistoricalBlockchainInfo(this.state.daysBack, this.state.timeBasis),
                EthereumService.getHistoricalPriceInfo(this.state.daysBack, this.state.timeBasis)
            ])
            .then(values => {
                let isCachingBlockchainInfo = false;
                let isCachingPriceInfo = false;
                let updatedBlockchainInfo = this.state.historicalBlockchainInfo;
                let updatedPriceInfo = this.state.historicalPriceInfo;

                if (Maybe.of(values[0]).prop('__status').isNothing()) {
                    updatedBlockchainInfo = values[0];
                } else {
                    isCachingBlockchainInfo = true;
                }

                if (Maybe.of(values[1]).prop('__status').isNothing()) {
                    updatedPriceInfo = values[1];
                } else {
                    isCachingPriceInfo = true;
                }

                this.setState({
                    historicalBlockchainInfo: updatedBlockchainInfo,
                    historicalPriceInfo     : updatedPriceInfo,
                    isCachingPriceInfo,
                    isCachingBlockchainInfo,
                    isFetching              : false
                }, cb);
            })
            .catch(error => {
                console.log(error);
                this.setState({ error: true, isFetching: false });
            });
    }
}

export default withRouter(App);
