import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';

function Hero ({
    icon,
    iconPrefix,
    theme,
    title,
    link,
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
                                        <a href={link}>
                                            <Icon icon={icon} prefix={iconPrefix} />&nbsp;
                                        </a>
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
                                    { subtitle }
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
