import React from 'react';
import moment from 'moment';
import EthereumService from '../services/domain/EthereumService';
import Icon from './common/Icon';

class NextStatsTicker extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            nextStats: null
        };
    }
    componentDidMount () {
        this.setState({
            isFetching: true
        }, () => {
            EthereumService.getNextStats()
                .then(nextStats => {
                    this.setState({ nextStats, isFetching: false });
                })
                .catch(error => {
                    this.setState({error: true, isFetching: false });
                    console.error(error);
                });
        });
    }
    render () {
        if (this.state.error || this.state.isFetching) {
            return <span />;
        }
        if (!this.state.nextStats) {
            return (
                <span>
                    <Icon icon="cog fa-spin" prefix="fas" />
                    &nbsp;Stats In Progress
                </span>
            );
        }
        const nextStatsIn = moment(moment(this.state.nextStats).diff(moment())).format('mm:ss');
        return (
            <span>
                <Icon icon="leaf" />
                &nbsp;Fresh Stats In {nextStatsIn}
            </span>
        );
    }
}

export default NextStatsTicker;
