import React from 'react';
import PropTypes from 'prop-types';

function Icon ({
    icon,
    className
}) {
    return (<i className={`fa fa-${icon} ${className || ''}`} />);
}

Icon.propTypes = {
    icon     : PropTypes.string.isRequired,
    classname: PropTypes.string
};

export default Icon;
