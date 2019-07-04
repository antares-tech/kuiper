/*
 * Umbrella file to be required in order to access module functionality */
const appClient     = require ('./lib/app/appClient');
const serviceClient = require ('./lib/service/serviceClient');

const kuiper = {
	appClient     : appClient,
	serviceClient : serviceClient
};

module.exports = kuiper;
