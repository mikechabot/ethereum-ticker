import React from 'react';
import numeral from 'numeral';

import EthereumService from '../services/domain/EthereumService';

import Alert from './common/bulma/Alert';
import { EXCHANGE_POLLING_IN_SEC } from '../common/app-const';
import Icon from './common/Icon';
import Flex from './common/glamorous/Flex';

class TopVolumeTo extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            isFetching: true,
            error     : null
        };
        this._renderCoin = this._renderCoin.bind(this);
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
                            Unable to fetch volume data.&nbsp;<a href="javascript:void(0);" onClick={this._tryAgain}>Try again?</a>
                        </span>
                    )}
                    icon="exclamation-triangle"
                />
            );
        }

        return (
            <div className="container">
                { this.state.topVolumeTo.map(this._renderCoin) }
            </div>
        );
    }

    _renderCoin (coin, index) {
        const { info } = coin;
        return (
            <div key={index} className="card m-top--large">
                <div className="card-content">
                    <div className="media">
                        <div className="media-left">
                            <figure className="image is-48x48">
                                {
                                    info
                                        ? <img src={`https://www.cryptocompare.com/${info.imageUrl}`} alt={coin.NAME} />
                                        : <Icon icon="question-circle fa-2x" />
                                }
                            </figure>
                        </div>
                        <div className="media-content" style={{overflow: 'hidden'}}>
                            <p className="title is-4">
                                {coin.FULLNAME}&nbsp;
                            </p>

                            {
                                info
                                    ? (
                                        <p className="subtitle is-6">
                                            {
                                                info.twitter
                                                    ? <span><a href={`https://twitter.com/${info.twitter}`} target="_blank">{info.twitter}</a> |&nbsp;</span>
                                                    : null
                                            }
                                            {
                                                info.affiliateUrl
                                                    ? <span><a href={info.affiliateUrl}>{info.affiliateUrl}</a></span>
                                                    : null
                                            }
                                        </p>
                                    )
                                    : null
                            }
                        </div>
                        <div className="media-right" style={{overflow: 'hidden'}}>
                            <p className="title is-4">
                                #{index+1}
                            </p>
                        </div>
                    </div>
                    {
                        info
                            ? (
                                <div className="content">
                                    <div dangerouslySetInnerHTML={{__html: info.description}}></div>
                                </div>
                            )
                            : null
                    }
                </div>
                <footer className="card-footer">
                    <div className="card-footer-item">
                        <Flex flexWrap="wrap" hAlignCenter>
                            <strong>Volume 24H To</strong>&nbsp;<Icon icon="ethereum" prefix="fab" />&nbsp;{ numeral(coin.VOLUME24HOURTO).format('0,0.00') }
                        </Flex>
                    </div>
                    {
                        info
                            ? (
                                <p className="card-footer-item">
                                    <span>
                                        <a href={`https://www.cryptocompare.com${info.url}`} target="_blank"><Icon icon="chart-line" />&nbsp;View Chart</a>
                                    </span>
                                </p>
                            )
                            : null
                    }

                </footer>
            </div>
        );
    }

    _loadData (silent) {
        this._loadVolumeData(silent);
    }

    _loadVolumeData (silent) {
        this.setState({
            isFetching: !silent
        }, this._getAndSetVolumeData);
    }

    _getAndSetVolumeData () {
        EthereumService
            .getTopVolumeToInfo()
            .then(topVolumeTo => {
                this.setState({
                    topVolumeTo: topVolumeTo.Data,
                    isFetching : false
                }, () => {
                    if (!this.interval) {
                        this.interval = window.setInterval(this._loadVolumeData.bind(this, true), EXCHANGE_POLLING_IN_SEC * 1000);
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

export default TopVolumeTo;
