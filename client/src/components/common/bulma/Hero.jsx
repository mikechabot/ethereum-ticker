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
                    <h1 className="title is-size-5-mobile">
                        { _maybeRenderIcon(icon, iconPrefix)}
                        { title }
                    </h1>
                    { _maybeRenderSubtitle(subtitle) }
                </div>
            </div>
        </section>
    );
}

function _maybeRenderIcon (icon, prefix, link) {
    if (icon) {
        return (
            <span>
                <a href={link || '#'}>
                    <Icon icon={icon} prefix={prefix} />&nbsp;
                </a>
            </span>
        );
    }
}

function _maybeRenderSubtitle (subtitle) {
    if (subtitle) {
        return (
            <h2 className="subtitle is-size-6-mobile">
                { subtitle }
            </h2>
        );
    }
}

Hero.propTypes = {
    title   : PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    theme   : PropTypes.string,
    icon    : PropTypes.string
};

export default Hero;
