import React from 'react';
import Maybe from 'maybe-baby';
import { withRouter } from 'react-router-dom';
import { Tabs, Tab } from 'react-tabify';

import EthereumService from '../services/domain/EthereumService';

import CandlestickChart from './common/CandlestickChart';
import PriceLevel from './PriceLevel';
import Footer from './common/bulma/Footer';
import Icon from './common/Icon';
import Alert from './common/bulma/Alert';

import {HOURS_MENU, TIME_INTERVAL} from '../common/app-const';
import ButtonGroup from './common/bulma/ButtonGroup';
import NextStatsTicker from './NextStatsTicker';
import Flex from './common/glamorous/Flex';
import Exchanges from './Exchanges';

const DEFAULT_INTERVAL_KEY = TIME_INTERVAL[0].key;

class App extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            hoursBack               : 24,
            timeBasis               : DEFAULT_INTERVAL_KEY,
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
            <div style={{width: '100%'}}>
                { this._renderHeader() }
                <PriceLevel />
                <Tabs theme={{
                    main: {
                        color: '#363636'
                    }
                }} id="tabs" defaultActiveKey={0}>
                    <Tab eventKey={0} label="Chart">
                        <Flex column flex={1} padding={20}>
                            { this._renderChartControls() }
                            { this._renderChart() }
                        </Flex>
                    </Tab>
                    <Tab eventKey={1} label="Top Exchanges">
                        <Flex column flex={1} padding={5}>
                            <Exchanges />
                        </Flex>
                    </Tab>
                </Tabs>
                <div>
                    <Footer />
                </div>
            </div>
        );
    }

    _renderHeader () {
        return (
            <nav className="navbar is-light" role="navigation" aria-label="main navigation">
                <div className="navbar-brand">
                    <a className="navbar-item is-size-4-desktop is-size-5-tablet is-size-6-mobile" href="http://marketmovers.io">
                        <Icon icon="ethereum fa-2x" prefix="fab" />&nbsp;
                        <span>marketmovers.io</span>
                    </a>
                </div>
                <div className="navbar-end is-hidden-tablet-only is-hidden-mobile">
                    <div className="navbar-item">
                        <NextStatsTicker />
                    </div>
                </div>
            </nav>
        );
    }

    _renderChartControls () {
        return (
            <nav className="level notification light">
                <div className="level-item has-text-centered">
                    <div>{ this._renderHoursButtons() }</div>
                    &nbsp;
                    &nbsp;
                    <div>{ this._renderTimeBasis() }</div>
                </div>
            </nav>
        );
    }

    _renderIsFetchingChart () {
        return (
            <div className="notification light has-text-centered">
                <Icon icon="cog fa-spin fa-5x" prefix="fas" />
            </div>
        );
    }

    _renderFetchingError () {
        return (
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
        );
    }

    _renderCacheNotReady () {
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

    _renderChart () {
        if (this.state.isFetching) {
            return this._renderIsFetchingChart();
        }
        if (this.state.error) {
            return this._renderFetchingError();
        }
        if (this.state.isCachingBlockchainInfo || this.state.isCachingPriceInfo) {
            return this._renderCacheNotReady();
        }
        return (
            <div>
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
                            color             : '#4a4a4a',
                            type              : 'candlestick',
                            risingColor       : '#23d260',
                            fallingColor      : '#ff3860',
                            label             : 'ETH/USD',
                            data              : this.state.historicalPriceInfo,
                            yValueFormatString: '$#,##0.00',
                            xValueFormatString: 'MMM-DD hTT K'
                        },
                        {
                            type              : 'line',
                            color             : '#3273dd',
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

    _renderHoursButtons () {
        return (
            <ButtonGroup
                items={HOURS_MENU}
                activeKey={this.state.hoursBack}
                onClick={hoursBack => {
                    this.setState({hoursBack: hoursBack}, () => this._fetchNewData());
                }}
            />
        );
    }

    _renderTimeBasis () {
        return (
            <ButtonGroup
                items={TIME_INTERVAL}
                activeKey={this.state.timeBasis}
                onClick={timeBasis => {
                    this.setState({timeBasis: timeBasis}, () => this._fetchNewData());
                }}
            />
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
                EthereumService.getHistoricalBlockchainInfo(this.state.hoursBack, this.state.timeBasis),
                EthereumService.getHistoricalPriceInfo(this.state.hoursBack, this.state.timeBasis)
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
