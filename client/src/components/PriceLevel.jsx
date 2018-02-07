import React from 'react';

import EthereumService from '../services/domain/EthereumService';

import Icon from './common/Icon';
import Alert from './common/bulma/Alert';
import {PRICE_LEVEL_CONFIG, BLOCKCHAIN_POLLING_INTERVAL_IN_SEC, PRICE_POLLING_INTERVAL_IN_SEC} from '../common/app-const';

class PriceLevel extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            isFetchingPrice     : true,
            isFetchingBlockchain: true,
            error               : null
        };
        this._loadData = this._loadData.bind(this);
        this._tryAgain = this._tryAgain.bind(this);
        this._renderLevelItem = this._renderLevelItem.bind(this);
        this.priceInterval = null;
        this.blockchainInterval = null;
    }

    componentDidMount () {
        this._loadData();
    }

    render () {
        return (
            <div>
                { this._renderPriceError() }
                { this._renderLevel(PRICE_LEVEL_CONFIG)}
            </div>
        );
    }

    _renderLevel (level) {
        if (!this.state.error) {
            return (
                <nav className="notification level is-dark">
                    { level.map(this._renderLevelItem)}
                </nav>
            );
        }
    }

    _renderLevelItem (item, index) {
        if (!this.state.error) {
            // return <span>CUNT!</span>;
            return (
                <div key={index} className="level-item has-text-centered" title={item.label}>
                    <div>
                        <p className="heading">{item.label}</p>
                        <div className="title">
                            { this._maybeRenderIcon(item) }
                            <span>
                                {this._getDisplayValue(item)}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
    }

    _maybeRenderIcon (item) {
        if (item.icon) {
            return (
                <span>
                    <Icon icon={item.icon} prefix={item.iconPrefix} />&nbsp;
                </span>
            );
        }
    }

    _getDisplayValue (item) {
        let value = this.state[item.stateKey];
        if (this.state[item.pendingKey]) {
            value = (
                <span>
                    <i className="fas fa-cog fa-spin" />
                </span>
            );
        } else {
            if (item.getValueFromRaw) {
                value = (
                    <div style={{display: 'inline'}}>
                        { item.getValueFromRaw(value) }
                    </div>
                );
            } else {
                if (item.propKey) {
                    value = value[item.propKey];
                }
                if (item.getValue) {
                    value = item.getValue(value);
                }
            }
        }
        return value;
    }

    _renderPriceError () {
        if (this.state.error) {
            return (
                <Alert
                    className="is-danger"
                    onClick={this._tryAgain}
                    content={(
                        <span>
                        Unable to fetch prices.&nbsp;<a href="javascript:void(0);" onClick={this._tryAgain}>Try again?</a>
                        </span>
                    )}
                    icon="exclamation-triangle"
                />
            );
        }
    }

    _loadData (silent) {
        this._loadPriceInfo(silent);
        this._loadBlockchainInfo(silent);
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

    _getAndSetPriceInfo () {
        EthereumService
            .getPriceInfo()
            .then(priceInfo => {
                this.setState({
                    priceInfo,
                    isFetchingPrice: false
                }, () => {
                    if (!this.priceInterval) {
                        this.priceInterval = window.setInterval(this._loadPriceInfo.bind(this, true), PRICE_POLLING_INTERVAL_IN_SEC * 1000);
                    }
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
                }, () => {
                    if (!this.blockchainInterval) {
                        this.blockchainInterval = window.setInterval(this._loadBlockchainInfo.bind(this, true), BLOCKCHAIN_POLLING_INTERVAL_IN_SEC * 1000);
                    }
                });
            })
            .catch(error => {
                this.setState({ error: true, isFetchingBlockchain: false });
                console.log(error);
            });
    }

    _tryAgain () {
        if (this.blockchainInterval) {
            window.clearInterval(this.blockchainInterval);
            this.blockchainInterval = null;
        }
        if (this.priceInterval) {
            window.clearInterval(this.priceInterval);
            this.priceInterval = null;
        }
        this.setState({
            error               : false,
            isFetchingBlockchain: true,
            isFetchingPrice     : true
        }, this._loadData);
    }
}

export default PriceLevel;
