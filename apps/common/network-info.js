var store  = require('../../common/store');
var log    = require('../../common/log').child ({ module : 'apps/common/locals' });

var network_info = {};

network_info.via_proxy = function (app_name) {

	var access_point = '';
	var config       = {};
	var name         = app_name && typeof app_name === 'string' ? app_name : store.get ('name');
	var type         = store.get ('type');

	config.protocol      = get_from_store(`config/global/protocol`);
	config.addr          = get_from_store(`config/global/addr`);
	config.proxy_prefix  = get_from_store(`config/${type}/${name}/proxy_prefix`);

	access_point = `${config.protocol}://${config.addr}/${config.proxy_prefix}`;

	return access_point;
};

network_info.without_proxy = function (app_name) {
	
	var access_point = '';
	var config      = {};
	var name        = app_name && typeof app_name === 'string' ? app_name : store.get ('name');
	var type        = store.get ('type');

	config.protocol  = get_from_store(`config/global/protocol`);
	config.addr      = get_from_store(`config/global/addr`);
	config.port      = get_from_store(`config/${type}/${name}/port`);
	
	access_point = `${config.protocol}://${config.addr}:${config.port}`;

	return access_point;
};

network_info.how_do_i_look = function (app_name) {

	var is_proxy = get_from_store ('config/global/proxy');

	if (is_proxy && is_proxy === 'false')
		return network_info.without_proxy (app_name);

	return network_info.via_proxy (app_name);
};

/*
 * A network end point is defined by the following variables:
 *
 *     host          ==> This FQDN or the ip address of the host.
 *     port          ==> This is what the application binds on.
 *                       It is also the port visible to external entities if
 *                       there is no proxy.
 *     protocol      ==> This is either "http" or "https".
 *     proxy         ==> This is either true or false.
 *     proxy_prefix  ==> Is checked only if the proxy is true.
 *     proxy_port    ==> This is the external port (usually 443 in case of "https")
 *                       visible to outside entities. Note, that the application itself
 *                       does not bind to this.
 *
 */
network_info.network_ep = function (type, name) {
	if (type !== 'app' && type !== 'srv' && type !== 'global')
		throw new Error (`invalid type "${type}" for network_ep`);

	var host         = get_from_store (`config/${type}/${name}/host`);
	var port         = get_from_store (`config/${type}/${name}/port`);
	var protocol     = get_from_store (`config/${type}/${name}/protocol`);
	var proxy        = get_from_store (`config/${type}/${name}/proxy`) == 'true' ? true : false;
	var proxy_prefix = get_from_store (`config/${type}/${name}/proxy_prefix`);
	var proxy_port   = get_from_store (`config/${type}/${name}/proxy_port`);

	if (!host)
		throw new Error (`configuration "config/${type}/${name}/host" not set`);
	if (!port)
		throw new Error (`configuration "config/${type}/${name}/port" not set`);

	/*
	 * If there _is_ a proxy prefix and it doesn't start with a '/' then bomb
	 */
	if (proxy && proxy_prefix && !proxy_prefix.match(/^\//g))
		throw new Error (`invalid proxy prefix "${proxy_prefix}" for ${type}/${name}`);

	if (!protocol)
		protocol = 'http';

	var ep = `${protocol}://${host}`;

	/*
	 * If the proxy is set, then the only relevant port is the proxy
	 * port from an external connectivity point of view.
	 */
	if (proxy)
		port = proxy_port;

	/*
	 * Avoid adding ":443" for https and ":80" for http
	 */
	if (!((protocol === 'https' && port === '443') || 
		  (protocol === 'http'  && port === '80'))) {
		ep += `:${port}`;
	}

	if (proxy && proxy_prefix)
		ep += `${proxy_prefix}`;

	/*
	 * Shave off any trailing slashes before returning
	 * the endpoint
	 */
	return ep.replace (/\/\s*$/g, '');
};

network_info.auth_network_ep = function () {
	return network_info.network_ep ('global', 'auth');
};

network_info.auth_gw_access_point = function () {
	/*
	 * IMPORTANT : This function should be deprecated in favor of "auth_network_ep"
	 */

	var is_proxy = get_from_store('config/global/proxy');

	if (is_proxy && is_proxy === 'false')
		return network_info.auth_ep_without_proxy();

	return network_info.auth_ep_via_proxy();
};

network_info.auth_ep_without_proxy = function () {
	var ep = '';
	var config = {};

	config.protocol = get_from_store (`config/global/protocol`);
	config.addr     = get_from_store (`config/global/addr`);
	config.port     = get_from_store (`config/app/global/auth/port`);

	ep += `${config.protocol}://${config.addr}:${config.port}`;

	return ep;
};

network_info.auth_ep_via_proxy = function () {
	var ep = '';
	var config = {};

	config.protocol     = get_from_store (`config/global/protocol`);
	config.addr         = get_from_store (`config/global/addr`);
	config.proxy_prefix = get_from_store (`config/app/global/auth/proxy_prefix`);

	ep += `${config.protocol}://${config.addr}/${config.proxy_prefix}`;

	return ep;
};

network_info.get_redirect_uri = function (path) {

	var regex = /^\/+|\/+$/g;
	var is_proxy = get_from_store ('config/global/proxy');

	path = typeof path === 'string' ? path.replace(regex, "").trim() : "";
	if (is_proxy && is_proxy === 'false')
		return `/${path}`;

	var name = store.get('name');
	var prefix = store.get (`config/app/${name}/proxy_prefix`);
	return  `/${prefix}/${path}`;
};

function get_from_store (key) {
	var val = store.get(key);

	if (store.get (key) === 'undefined')
		throw new Error (`key:${key} is undefined, configuration setup error`);

	return val;
}

module.exports = network_info;
