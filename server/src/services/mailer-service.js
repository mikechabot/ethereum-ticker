import ConfigService from './config-service';
import logger from '../logger/logger';
import {EMAIL_FROM_ADDRESS} from '../common/app-const';

const apiKey = ConfigService.getMailerKey();
const domain = ConfigService.getMailerDomain();

const mailgun = require('mailgun-js')({apiKey, domain});

let svc = {};
const MailerService = svc = {
    generateMessage (subject, message) {
        return {
            from   : EMAIL_FROM_ADDRESS,
            to     : ConfigService.getEmailRecipients(),
            subject: subject,
            html   : message
        };
    },
    generateThresholdMessage (label, threshold, count) {
        return svc.generateMessage(
            __generateThresholdSubject(label),
            __generateThresholdBody(label, threshold, count)
        );
    },
    sendMessage (subject, message) {
        return new Promise((resolve, reject) => {
            return mailgun
                .messages()
                .send(svc.generateMessage(subject, message), (error, body) => {
                    if (error) {
                        return reject(error);
                    } else {
                        svc.lastAlertSent = new Date();
                        logger.info(body);
                        resolve();
                    }
                });
        });
    }
};

function __generateThresholdSubject (label) {
    return `*Blockchain Alert* ETH ${label} above threshold`;
}

function __generateThresholdBody (label, threshold, count) {
    return `${label}: <strong style="color: red">${count}</strong><br/>Configured threshold: <strong style="color: green">${threshold}</strong>${__generateFooter()}`;
}

function __generateFooter () {
    return '<br/><br/>This email was generated automatically by <a href="http://marketmovers.io">http://marketmovers.io</a>.';
}

export default MailerService;
