const PATH = {
    ETHEREUM: '/api/eth'
};

export default {
    configure (app, controller) {
        app.get(PATH.ETHEREUM, controller.handleGetBlockchainInfo);
    }
};
