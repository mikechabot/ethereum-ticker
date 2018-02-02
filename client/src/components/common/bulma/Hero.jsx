import React from 'react';
import PropTypes from 'prop-types';

function Hero ({
    icon,
    theme,
    title,
    subtitle
}) {
    return (
        <section className={`hero ${theme ? `is-${theme}` : ''}`}>
            <div className="hero-body">
                <div className="container">
                    <h1 className="title">
                        {
                            icon
                                ? (
                                    <span>
                                        <i className="fa fa-chart-line" />&nbsp;
                                    </span>
                                )
                                : null
                        }
                        { title }
                    </h1>
                    {
                        subtitle
                            ? (
                                <h2 className="subtitle">
                                    Data-driven insights on the Ethereum blockchain
                                </h2>
                            )
                            : null

                    }
                </div>
            </div>
        </section>
    );
}

Hero.propTypes = {
    title   : PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    theme   : PropTypes.string,
    icon    : PropTypes.string
};

export default Hero;