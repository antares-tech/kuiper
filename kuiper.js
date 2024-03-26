/*
 * Umbrella file to be required in order to access module functionality */
const appClient     = require ('./lib/app/appClient');
const serviceClient = require ('./lib/service/serviceClient');
const log           = require ('./utils/log');

const kuiper = {
	appClient     : appClient,
	serviceClient : serviceClient,
	setLogLevel   : (level) => log.level(level),
};

module.exports = kuiper;
