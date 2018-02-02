import React from 'react';
import TestUtils from 'react-dom/test-utils';
import _find from 'lodash/find';

/**
 *
 * Stateless components don't get refs, meaning we can't access
 * the DOM, which we need in order to run our assertions.
 * We can solve this by wrapping our component in a generic React
 * class that extends its refs to child components
 *
 * http://stackoverflow.com/questions/36682241/testing-functional-components-with-renderintodocument/
 *
 * @param Component     Component to be wrapped
 * @param props         Props to pass to component
 * @returns
 */

export function renderStatelessComponent (ComponentType, props) {
    class Wrapper extends React.Component {
        render () {
            return this.props.children;
        }
    }

    return TestUtils.renderIntoDocument(
        <Wrapper>
            <ComponentType { ...props } />
        </Wrapper>
    );
}

/**
 * Find an element by id given a tree of elements
 * @param tree
 * @param id
 * @returns {*}
 */
export function findElementById (tree, id) {
    const element = _find(tree, element => {
        return TestUtils.isDOMComponent(element) && element.getAttribute('id') === id;
    });
    if (element) return element;
    console.log(`Unable to find element by id: ${id}`);
}

export default {
    renderStatelessComponent,
    findElementById
};
