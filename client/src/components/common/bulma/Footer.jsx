import React from 'react';
import Icon from '../Icon';

function Footer () {
    return (
        <footer className="footer has-text-grey-light">
            <div className="container">
                <div className="content has-text-centered">
                    <p>
                        <strong className="has-text-grey-light">
                            <Icon icon="ethereum" prefix="fab" />
                            &nbsp;Ethereum Ticker
                        </strong> by <a href="https://www.npmjs.com/~mikechabot">Mike Chabot</a> and Greg LaTouf.
                        <br />
                        The <a href="https://github.com/mikechabot/ethereum-ticker">source code</a> is licensed under <a href="http://fsf.org/">GNU General Public License v3.0</a>.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
