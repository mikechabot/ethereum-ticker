import React from 'react';
import {Flex} from '../glamorous/Flex';
import Icon from '../Icon';

function Alert ({
    onClick,
    className,
    content
}) {
    return (
        <Flex hAlignCenter className={`notification ${className}`}>
            <button
                className="delete"
                onClick={onClick}
            />
            <Icon icon="exclamation-triangle" />&nbsp;
            { content }
        </Flex>
    );
}

export default Alert;
