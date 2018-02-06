import React from 'react';
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

class App extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
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
                <div className="m-large">
                    <PriceLevel />
                </div>
                <div className="m-large" style={{height: '100%'}}>
                    <br />
                    <br />
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
        return (
            <div style={{height: '100%'}}>
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
        }, () => this._getAndSetChartInfo(
            () => {
                if (!this.interval) {
                    this.interval = window.setInterval(() => this._loadData(true), POLL_INTERVAL_IN_SECONDS * 1000);
                }
            }
        ));
    }

    _getAndSetChartInfo (cb) {
        Promise
            .all([
                EthereumService.getHistoricalBlockchainInfo(1),
                EthereumService.getHistoricalPriceInfo(1)
            ])
            .then(values => {
                this.setState({
                    historicalBlockchainInfo: values[0],
                    historicalPriceInfo     : values[1],
                    isFetching              : false
                }, cb);
            })
            .catch(error => {
                this.setState({ error: true, isFetching: false });
                console.log(error);
            });
    }
}

export default withRouter(App);
