import React from 'react';
import PropTypes from 'prop-types';

function ButtonGroup ({
    activeKey,
    items,

    onClick
}) {
    return (
        <div className="buttons has-addons">
            { items.map(_renderItem.bind(this, activeKey, onClick))}
        </div>
    );
}

function _renderItem (activeKey, onClick, item) {
    let className = 'button is-small';
    if (activeKey === item.key) {
        className = `${className} is-dark is-selected`;
    }
    return (
        <span
            key={item.key}
            title={item.label}
            className={className}
            onClick={() => {
                if (activeKey !== item.key) {
                    onClick(item.key);
                }
            }}>
            {item.label}
        </span>
    );
}

ButtonGroup.propTypes = {
    items: PropTypes.array
};

export default ButtonGroup;
