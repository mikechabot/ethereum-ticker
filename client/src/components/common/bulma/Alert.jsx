import React from 'react';
import PropTypes from 'prop-types';
import Flex from '../glamorous/Flex';
import Icon from '../Icon';

function Alert ({
    className,
    content,
    icon
}) {
    return (
        <Flex hAlignCenter className={`notification ${className || 'is-danger'}`}>
            <Icon icon={icon || 'exclamation-triangle'} />&nbsp;
            { content }
        </Flex>
    );
}

Alert.propTypes = {
    content: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.string
    ]).isRequired,
    className: PropTypes.string,
    icon     : PropTypes.string
};

export default Alert;
