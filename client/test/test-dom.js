let jsdom = require('jsdom');
const JSDOM = jsdom.JSDOM;

const dom = new JSDOM('<!DOCTYPE html><p>Hello world</p>');
global.window = dom.window.document.defaultView;
global.document = dom.window.document;
global.navigator = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36'
};

/**
 *  Add debug function
 */
if (!console.debug) {
    console.debug = () => {};
}
