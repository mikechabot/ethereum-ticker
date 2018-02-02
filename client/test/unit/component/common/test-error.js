import React from 'react';
import TestUtils from 'react-dom/test-utils';
import { expect } from 'chai';
import sinon from 'sinon';
import { renderStatelessComponent, findElementById } from '../../../react-utils';

import Error from '../../../../src/components/common/Error';

describe('Common Components', () => {
    describe('<Error />', () => {
        it('should display the message prop', () => {
            const props = {message: 'Test Message', id: 'foo-id'};
            const component = renderStatelessComponent(Error, props);
            const spans = TestUtils.scryRenderedDOMComponentsWithTag(component, 'span');
            const element = findElementById(spans, props.id);

            expect(element.id).to.equal(props.id);
            expect(element.textContent).to.equal(props.message);
        });
        it('should display a generic message if none is passed', () => {
            const stub = sinon.stub(console, 'error');

            const genericMessage = 'No detail provided';

            const rendered = renderStatelessComponent(Error, undefined);
            const spans = TestUtils.scryRenderedDOMComponentsWithTag(rendered, 'span');
            const element = findElementById(spans, 'foo-id');

            expect(TestUtils.isDOMComponent(element)).to.equal(true);
            expect(element.textContent).to.equal(genericMessage);

            stub.restore();
        });
    });
});
