import React from 'react';
import PropTypes from 'prop-types';

function Icon ({
    icon,
    prefix,
    onClick,
    className
}) {
    let iconPrefix = prefix || 'fa';
    return (
        <span onClick={onClick}>
            <i className={`${iconPrefix} fa-${icon} ${className || ''}`} />
        </span>
    );
}

Icon.propTypes = {
    icon     : PropTypes.string.isRequired,
    classname: PropTypes.string
};

export default Icon;
