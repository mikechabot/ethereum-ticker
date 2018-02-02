import React from 'react';
import Icon from '../Icon';

function Footer () {
    return (
        <footer className="footer">
            <div className="container">
                <div className="content has-text-centered">
                    <p>
                        <strong><Icon icon="chart-line" />&nbsp;Ethereum Ticker</strong> by <a href="https://www.npmjs.com/~mikechabot">Mike Chabot</a> and Greg LaTouf.
                        <br />
                        The <a href="https://github.com/mikechabot/ethereum-ticker">source code</a> is licensed <a href="http://fsf.org/">GNU General Public License v3.0</a>.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
