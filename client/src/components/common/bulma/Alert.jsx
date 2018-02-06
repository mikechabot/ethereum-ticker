import React from 'react';
import {Flex} from '../glamorous/Flex';
import Icon from '../Icon';

function Alert ({
    onClick,
    className,
    content,
    icon
}) {
    return (
        <Flex hAlignCenter className={`notification ${className || 'is-danger'}`}>
            <button
                className="delete"
                onClick={onClick}
            />
            <Icon icon={icon || 'exclamation-triangle'} />&nbsp;
            { content }
        </Flex>
    );
}

export default Alert;
