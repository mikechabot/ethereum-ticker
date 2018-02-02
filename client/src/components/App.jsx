import React from 'react';
import { withRouter } from 'react-router-dom';
import { Flex } from './common/glamorous/Flex';
import Hero from './common/bulma/Hero';
import Footer from './common/bulma/Footer';

function App ({ location, history }) {
    return (
        <Flex column flex={1}>
            <Hero
                theme="dark"
                title="Ethereum Ticker"
                subtitle="Data-driven insights on the Ethereum blockchain"
                icon="chart-line"
            />
            <Footer />
        </Flex>
    );
}

export default withRouter(App);
