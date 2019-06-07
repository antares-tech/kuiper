var __store = {};
var store  = {};

store.set =  (key, value, option) => {
	var replace = option ? option.replace : false;

	if (replace === false && __store[key])
		throw new Error (`store : key "${key}" exists (with value=${__store[key]})`);

	try {
		if (typeof value === "object")
			__store[key] = JSON.parse (JSON.stringify (value));
		else
			__store[key] = value;
	}
	catch (e) {
		throw new Error(`store : value not serializable (key=${key}). err=${e}`);
	}

	return true;
};

store.get = (key) => {

	if (!key)
		throw 'store : undefined key';

	return __store [key];
};

store.remove = (key) => {
	if (__store [key])
		delete __store[key];
};

module.exports = store;
