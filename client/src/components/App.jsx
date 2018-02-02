import React from 'react';
import { withRouter } from 'react-router-dom';
import { Flex } from './common/glamorous/Flex';
import Hero from './common/bulma/Hero';
import Footer from './common/bulma/Footer';
import EthereumService from '../services/domain/EthereumService';
import moment from 'moment';
import Icon from './common/Icon';

const MAX_REQUESTS_PER_HOUR = 500;

class App extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            blockchainInfo: null,
            pendingDelta  : -1
        };
        this._loadBlockchainInfo = this._loadBlockchainInfo.bind(this);
        this.interval = null;
    }

    componentDidMount () {
        this._fetchBlockchainInfo()
            .then(blockchainInfo => {
                this._setBlockchainState(blockchainInfo, () => {
                    this.interval = window.setInterval(this._loadBlockchainInfo, (60 * 60 / MAX_REQUESTS_PER_HOUR) * 1000);
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
        const { blockchainInfo, pendingDelta } = this.state;
        return (
            <Flex column flex={1} flexShrink={0}>
                <div>
                    <Hero
                        theme="dark"
                        title="Ethereum Ticker"
                        subtitle="Data-driven insights on the Ethereum blockchain"
                        icon="chart-line"
                    />
                </div>
                <div>
                    <section className="hero is-info is-large">
                        <div className="hero-body">
                            <div className="container">
                                <Flex>
                                    <div>
                                        <h1 className="subtitle">
                                            <Icon icon="th-large"/>
                                            &nbsp;Block Height
                                        </h1>
                                        <h2 className="title">{blockchainInfo.height}</h2>
                                    </div>
                                    <div className="m-left--large">
                                        <h1 className="subtitle">
                                            <Icon icon="clock"/>
                                            &nbsp;Last Block
                                        </h1>
                                        <h2 className="title">{moment(blockchainInfo.time).format('L LTS')}</h2>
                                    </div>
                                    <div className="m-left--large">
                                        <h1 className="subtitle">
                                            <Icon icon="hourglass"/>
                                            &nbsp;Pending Transactions
                                        </h1>
                                        <h2 className="title">{blockchainInfo.unconfirmed_count}</h2>
                                    </div>
                                    <div className="m-left--large">
                                        <h1 className="subtitle">
                                            <Icon icon="cog"/>
                                            &nbsp;Pending Delta
                                        </h1>
                                        <h2 className="title">
                                            {
                                                pendingDelta >= 0
                                                    ? <span>+{pendingDelta}</span>
                                                    : pendingDelta
                                            }
                                        </h2>
                                    </div>
                                </Flex>
                            </div>

                        </div>
                    </section>
                </div>
                <div>
                    <Footer />
                </div>
            </Flex>
        );
    }

    _loadBlockchainInfo () {
        this._fetchBlockchainInfo()
            .then(newBlockchainInfo => {
                if (!this.state.blockchainInfo || newBlockchainInfo._id !== this.state.blockchainInfo._id) {
                    this._setBlockchainState(newBlockchainInfo);
                }
            })
            .catch(error => {
                console.log(error);
            });
    }

    _fetchBlockchainInfo () {
        return EthereumService.getBlockchainInfo();
    }
    _setBlockchainState (blockchainInfo, cb) {
        this.setState({
            blockchainInfo,
            pendingDelta: this.state.pendingDelta === -1
                ? 0
                : blockchainInfo.unconfirmed_count - this.state.blockchainInfo.unconfirmed_count
        }, cb);
    }
}

export default withRouter(App);
