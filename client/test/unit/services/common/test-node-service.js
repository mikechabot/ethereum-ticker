import { expect } from 'chai';
import NodeService from '../../../../src/services/common/node-service';

describe('NodeService', () => {
    const PREV_NODE_ENV = process.env;

    afterEach(() => {
        process.env = PREV_NODE_ENV;
    });

    describe('getNodeEnv()', () => {
        it('should return Node process info when defined', () => {
            const testEnv = {foo: 'bar'};
            process.env = testEnv;
            expect(
                NodeService.getNodeEnv()
            ).to.equal(testEnv);
        });
        it('should return undefined if Node process info is unavailable', () => {
            delete process.env;
            expect(
                NodeService.getNodeEnv()
            ).to.equal(undefined);
        });
    });
    describe('getNodeEnvByKey()', () => {
        it('should return undefined if the object does not contain the key', () => {
            expect(
                NodeService.getNodeEnvByKey('foobaz')
            ).to.equal(undefined);
        });
        it('should throw an error if the key provided is null/undefined', () => {
            expect(() => {
                NodeService.getNodeEnvByKey(undefined);
            }).throws('Key cannot be null/undefined');
        });
    });
    describe('getNodeEnvMode()', () => {
        it('should return the Node environment mode', () => {
            const mode = 'foobar';
            process.env.NODE_ENV = mode;

            expect(
                NodeService.getNodeEnvMode()
            ).to.equal(mode);
        });
        it('should return test mode NODE_ENV is undefined/null', () => {
            delete process.env.NODE_ENV;
            expect(
                NodeService.getNodeEnvMode()
            ).to.equal('test');
        });
    });
    describe('isProduction()', () => {
        it('should return true if NODE_ENV is production', () => {
            process.env.NODE_ENV = 'production';
            expect(
                NodeService.isProduction()
            ).to.equal(true);
        });
        it('should return false if NODE_ENV is not production', () => {
            process.env.NODE_ENV = 'foobar';
            expect(
                NodeService.isProduction()
            ).to.equal(false);
        });
    });
    describe('isDevelopment()', () => {
        it('should return true if NODE_ENV is development', () => {
            process.env.NODE_ENV = 'development';
            expect(
                NodeService.isDevelopment()
            ).to.equal(true);
        });
        it('should return false if NODE_ENV is not development', () => {
            process.env.NODE_ENV = 'foobar';
            expect(
                NodeService.isDevelopment()
            ).to.equal(false);
        });
    });
    describe('isTest()', () => {
        it('should return true if NODE_ENV is test', () => {
            process.env.NODE_ENV = 'test';
            expect(
                NodeService.isTest()
            ).to.equal(true);
        });
        it('should return false if NODE_ENV is not test', () => {
            process.env.NODE_ENV = 'foobar';
            expect(
                NodeService.isTest()
            ).to.equal(false);
        });
        it('should return true if NODE_ENV is null/undefined', () => {
            delete process.env.NODE_ENV;
            expect(
                NodeService.isTest()
            ).to.equal(true);
        });
    });
});
