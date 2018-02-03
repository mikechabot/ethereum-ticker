import React from 'react';
import PropTypes from 'prop-types';
import { Line, defaults } from 'react-chartjs-2';
import _max from 'lodash/max';
import {Flex} from './glamorous/Flex';
import moment from 'moment';

defaults.global.defaultFontFamily = 'Segoe UI';

const options = {
    scales: {
        yAxes: [
            {
                ticks: {
                    beginAtZero  : true,
                    maxTicksLimit: 6,
                    suggestedMax : 10
                }
            }
        ],
        xAxes: [
            {
                gridLines: {
                    display: false
                }
            }
        ]
    },
    tooltips: {
        enabled: false
    },
    responsive         : true,
    maintainAspectRatio: false
};

function _getOptions () {
    return options;
}

function _getX (entry, index) {
    return moment(entry.x).format('L LTS');
}

function _getY (entry, index) {
    return entry.y;
}

function _getData (data, map) {
    return data.map(map);
}

const DEFAULT_DATASET = {
    fill       : false,
    lineTension: 0.5,
    pointRadius: 0
};

function _getDataset (data, options) {
    const dataset = DEFAULT_DATASET;

    const { legend, theme } = options;

    dataset.label = legend;
    dataset.backgroundColor = `${theme || '#209cee'}`;
    dataset.borderColor = `${theme || '#209cee'}`;
    dataset.data = _getData(data, _getY);

    return [dataset];
}

function _getMax (chartData, yOffset) {
    return chartData.datasets[0].data.length !== 0
        ? _max(chartData.datasets[0].data) + yOffset
        : 10;
}

function _setSuggestedMaxOption (options, max) {
    options.scales.yAxes[0].ticks.suggestedMax = max;
}

function _setStepSizeOption (options, max) {
    let stepSize = Math.ceil(parseInt(max / 6, 10) / 100) * 100;
    if (max < 50) {
        stepSize = 5;
    } else if (max <= 100) {
        stepSize = 15;
    }
    options.scales.yAxes[0].ticks.stepSize = stepSize;
}

class Chart extends React.Component {
    constructor (props) {
        super(props);
    }

    render () {
        const {
            height,
            width,
            label,
            legend,
            dataset,
            theme,
            yOffset
        } = this.props;

        if (!dataset || dataset.length === 0) {
            return (
                <Flex height={height} width={width} hAlignCenter>
                    <Flex column hAlignCenter vAligCenter>
                        <div className="fa-stack fa-lg">
                            <i className="fa fa-line-chart fa-stack-1x" />
                            <i className="fa fa-ban fa-stack-2x has-text-danger fa-rotate-90" />
                        </div>
                        <div className="has-text-primary-dark">No data captured</div>
                    </Flex>
                </Flex>
            );
        }

        const chartData = {};

        chartData.labels = _getData(dataset, _getX);
        chartData.datasets = _getDataset(dataset, { legend, theme });

        let max = _getMax(chartData, 1000);

        const options = _getOptions();
        _setSuggestedMaxOption(options, max);
        _setStepSizeOption(options, max);

        return (
            <div style={{ height, width }} className="primary-font">
                <h2>{label}</h2>
                <Line data={chartData} options={options} />
            </div>
        );
    }
}

Chart.propTypes = {
    label   : PropTypes.string,
    legend  : PropTypes.string.isRequired,
    dataset : PropTypes.array,
    datasets: PropTypes.array,
    theme   : PropTypes.string
};

export default Chart;
