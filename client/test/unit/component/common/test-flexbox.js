import React from 'react';
import TestUtils from 'react-dom/test-utils';
import { expect } from 'chai';
import { renderStatelessComponent } from '../../../react-utils';

import Flexbox from '../../../../src/components/common/Flexbox';

describe('Flexbox Component', () => {
    let props;
    beforeEach(() => {
        props = { id: 'ABC' };
    });

    describe('<Flexbox />', () => {
        it('Should return a flexbox row', () => {
            const component = renderStatelessComponent(Flexbox, props);
            const element = TestUtils.findRenderedDOMComponentWithTag(component, 'div');
            expect(element.id).to.equal(props.id);
            expect(element.style.getPropertyValue('display')).to.equal('flex');
        });
    });
    describe('<Flexbox column={true} />', () => {
        it('Should return a flexbox column', () => {
            props = { ...{ column: true }, ...props };
            const component = renderStatelessComponent(Flexbox, props);
            const element = TestUtils.findRenderedDOMComponentWithTag(component, 'div');
            expect(element.id).to.equal(props.id);
            expect(element.style.display).to.equal('flex');
            expect(element.style.flexDirection).to.equal('column');
        });
    });
});
