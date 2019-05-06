/*
 * Umbrella file to be required
 * in order to access module functionality */
const appClient     = require ('./lib/appClient');
const serviceClient = require ('./lib/serviceClient');

const kuiper = {
	appClient     : appClient,
	serviceClient : serviceClient
};

module.exports = kuiper;
