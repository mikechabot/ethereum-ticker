import ConfigService from './config-service';
import logger from '../logger/logger';

const apiKey = ConfigService.getMailerKey();
const domain = ConfigService.getMailerDomain();

const options = {apiKey, domain};

const mailgun = require('mailgun-js')(options);

let svc = {};
const MailerService = svc = {
    generateMessage (subject, message) {
        return {
            from   : 'do-not-reply@marketmovers.io',
            to     : ConfigService.getEmailRecipients(),
            subject: subject,
            html   : message
        };
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

export default MailerService;
