var Error_3A = require ('../../../../common/3a-error');
var service  = require ('../service/api');
var log      = require ('../../../../common/log').child({ module : 'api/notification' });

var api = {};

/* Service check */
api.ping = () => {
	return service.get ('notification', '/ping');
};

api.get_version = () => {
	return service.get ('notification', '/common/revision');
};

/*
 * Actual service methods
 */

api.send_mail = async (data) => {
	try {
		await service.post ('notification', '/job/mail', data);
	}
	catch (e) {
		log.warn ({ err : e }, 'error in email send. ignoring.');
	}
};

module.exports = api;
