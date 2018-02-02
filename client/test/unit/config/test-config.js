import { expect } from 'chai';

describe('Config', () => {

    beforeEach(() => {
        delete process.env.ENV_CONFIG_PATH;
        const name = require.resolve('../../../config/config');
        if (name) {
            delete require.cache[name];
        }
    });

    describe('when ENV_CONFIG_PATH is defined', () => {
        it('should use configuration at the defined filepath', () => {
            process.env.ENV_CONFIG_PATH = '../test/unit/config/test-config.default';
            expect(
                require('../../../config/config')
            ).to.equal(
                require('./test-config.default.json')
            );

        });
    });

    describe('when ENV_CONFIG_PATH is not defined', () => {
        it('should use configuration at the defined filepath', () => {
            expect(
                require('../../../config/config')
            ).to.equal(
                require('../../../config/config.default.json')
            );
        });
    });

});