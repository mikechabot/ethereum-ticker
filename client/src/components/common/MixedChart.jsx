import React from 'react';
import PropTypes from 'prop-types';
import { Bar } from 'react-chartjs-2';
import _max from 'lodash/max';
import {Flex} from './glamorous/Flex';
import moment from 'moment';
import Icon from './Icon';

const options = {
    responsive         : true,
    maintainAspectRatio: false,
    tooltips           : {
        mode: 'label'
    },
    elements: {
        line: {
            fill: false
        }
    },
    scales: {
        xAxes: [
            {
                display  : true,
                gridLines: {
                    display: false
                }
            }
        ],
        yAxes: [
            {
                type     : 'linear',
                display  : true,
                position : 'left',
                id       : 'y-axis-1',
                gridLines: {
                    display: false
                },
                ticks: {
                    beginAtZero  : true,
                    maxTicksLimit: 6,
                    suggestedMax : 10
                }
            },
            {
                type     : 'linear',
                display  : true,
                position : 'right',
                id       : 'y-axis-2',
                gridLines: {
                    display: false
                },
                ticks: {
                    beginAtZero  : true,
                    maxTicksLimit: 6,
                    suggestedMax : 10
                }
            }
        ]
    }
};

function _getX (entry, index) {
    return moment(entry.x).format('L LTS');
}

function _getY (entry, index) {
    return entry.y;
}

function _getData (data, map) {
    return data.map(map);
}

function _getMax (dataset, yOffset) {
    return dataset.data.length !== 0
        ? _max(dataset.data) + yOffset
        : 10;
}

function _setSuggestedMaxOption (options, max, index) {
    options.scales.yAxes[index].ticks.suggestedMax = max;
}

function _setStepSizeOption (options, max, index) {
    let stepSize = Math.ceil(parseInt(max / 6, 10) / 100) * 100;
    if (max < 50) {
        stepSize = 5;
    } else if (max <= 100) {
        stepSize = 15;
    }
    options.scales.yAxes[index].ticks.stepSize = stepSize;
}

class MixedChart extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            chartIndex: false
        };
    }

    render () {
        const {
            height,
            width,
            label,
            datasets
        } = this.props;

        if (!datasets || datasets.length === 0) {
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

        options.scales.xAxes[0].labels = _getData(datasets[0].data, _getX);

        const chartData = {
            datasets: datasets.map((dataset, index) => {
                const hex = index === 0 ? '#EC932F' : '#71B37C';
                let chartType;

                if (this.state.chartIndex === 2) {
                    chartType = 'line';
                } else if (index === 0) {
                    chartType = this.state.chartIndex === 1 ? 'line' : 'bar';
                } else {
                    chartType = this.state.chartIndex === 1 ? 'bar' : 'line';
                }

                const newDataset = {
                    label                    : dataset.label,
                    type                     : chartType,
                    data                     : _getData(dataset.data, _getY),
                    fill                     : false,
                    borderColor              : hex,
                    backgroundColor          : hex,
                    pointBorderColor         : hex,
                    pointBackgroundColor     : hex,
                    pointHoverBackgroundColor: hex,
                    pointHoverBorderColor    : hex,
                    yAxisID                  : `y-axis-${index + 1}`
                };

                let max = _getMax(newDataset, 200);
                _setSuggestedMaxOption(options, max, index);
                _setStepSizeOption(options, max, index);
                return newDataset;
            })
        };

        return (
            <div style={{ height, width }} className="primary-font">
                <Icon
                    icon="chart-line"
                    className="pointer"
                    onClick={() => {
                        this.setState({
                            chartIndex: this.state.chartIndex === 2 ? 0 : this.state.chartIndex + 1
                        });
                    }}/>
                <h2>{label}</h2>
                <Bar
                    data={chartData}
                    options={options}
                />
            </div>
        );
    }
}

MixedChart.propTypes = {
    label   : PropTypes.string,
    datasets: PropTypes.array.isRequired
};

export default MixedChart;
