import React from 'react';
import PropTypes from 'prop-types';
import Icon from './Icon';

class CandlestickChart extends React.Component {
    constructor (props) {
        super(props);
        this._generateDataset = this._generateDataset.bind(this);
        this.chart = null;
    }
    componentDidMount () {
        this._initChart(this.props);
    }

    componentWillReceiveProps (nextProps) {
        this._initChart(nextProps);
    }

    _initChart (props) {
        props.datasets.forEach(dataset => {
            dataset.data.forEach(entry => {
                entry.x = new Date(entry.x);
            });
        });
        this.chart = new CanvasJS.Chart(props.id, {
            zoomEnabled     : true,
            height          : props.height,
            animationEnabled: false,
            theme           : this.props.theme || 'light1', // "light1", "light2", "dark1", "dark2"
            exportEnabled   : true,
            subtitles       : [{
                fontFamily: 'Inconsolata',
                text      : props.legend
            }],
            axisX: {
                valueFormatString: 'hh:mm TT K',
                labelFontFamily  : 'Inconsolata',
                labelFontSize    : 10,
                crosshair        : {
                    enabled        : true,
                    snapToDataPoint: true
                }
            },
            axisY  : props.yAxis,
            axisY2 : props.yAxis2,
            toolTip: {
                shared: true
            },
            legend: {
                reversed : true,
                cursor   : 'pointer',
                itemclick: toggleDataSeries,
                fontSize : 12
            },
            data: props.datasets.map(this._generateDataset)
        });
        this.chart.render();
    }

    render () {
        if (this.props.isFetching) {
            return <Icon icon="cog fa-spin" prefix="fas" />;
        }

        return (
            <div
                id={this.props.id}
                style={{width: '100%', height: this.props.height}}
            />
        );
    }

    _generateDataset (dataset, index) {
        const ds = {
            type        : dataset.type,
            name        : dataset.label,
            dataPoints  : dataset.data,
            showInLegend: true
        };
        if (dataset.lineColor) {
            ds.lineColor = dataset.lineColor;
        }
        if (dataset.markerColor) {
            ds.lineColor = dataset.lineColor;
        }
        if (dataset.axisYType) {
            ds.axisYType = dataset.axisYType;
        }
        if (dataset.yValueFormatString) {
            ds.yValueFormatString = dataset.yValueFormatString;
        }
        if (dataset.xValueFormatString) {
            ds.xValueFormatString = dataset.xValueFormatString;
        }
        return ds;
    }
}

function toggleDataSeries (e) {
    if (typeof (e.dataSeries.visible) === 'undefined' || e.dataSeries.visible) {
        e.dataSeries.visible = false;
    } else {
        e.dataSeries.visible = true;
    }
    e.chart.render();
}

CandlestickChart.propTypes = {
    id        : PropTypes.string.isRequired,
    isFetching: PropTypes.bool,
    label     : PropTypes.string,
    datasets  : PropTypes.array
};

export default CandlestickChart;
