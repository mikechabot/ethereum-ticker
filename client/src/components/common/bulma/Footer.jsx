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
                            &nbsp;marketmovers.io
                        </strong> by <a href="https://www.npmjs.com/~mikechabot" target="_blank" rel="noopener noreferrer">Mike Chabot</a>, Greg LaTouf & David Lau.
                        <br />
                        The <a href="https://github.com/mikechabot/ethereum-ticker" target="_blank" rel="noopener noreferrer">source code</a> is licensed under <a href="http://fsf.org/">GNU General Public License v3.0</a>.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
