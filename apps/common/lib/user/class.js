/**************************************************************************
 *
 *
 * ##......##....###....########..##....##.####.##....##..######..
 * ##..##..##...##.##...##.....##.###...##..##..###...##.##....##.
 * ##..##..##..##...##..##.....##.####..##..##..####..##.##.......
 * ##..##..##.##.....##.########..##.##.##..##..##.##.##.##...####
 * ##..##..##.#########.##...##...##..####..##..##..####.##....##.
 * ##..##..##.##.....##.##....##..##...###..##..##...###.##....##.
 * .###..###..##.....##.##.....##.##....##.####.##....##..######..
 *
 * This file is also included by the react application. Do not make
 * changes to this file without thinking.
 * 
 **************************************************************************/

class User {
	constructor (user) {

		if (!user || !user.detail)
			throw new Error ('no user or user detail found');

		this.user_detail = user.detail;
	}

	get user () { return this.user_detail; }
	get name () { return this.user_detail.firstName + ' ' + this.user_detail.lastName; }
	get permFlags () { 
		return (this.user_detail.role &&
				this.user_detail.role.perms &&
				this.user_detail.role.perms.flags
			   );
	}

	scope (tag, verb) {
		var perms = this.user_detail.role && this.user_detail.role.perms;
		if (!perms)
			return null;

		if (!perms[tag])
			return null;

		if (!perms[tag][verb] || !perms[tag][verb].allowed)
			return null;

		if (!perms[tag].scope)
			return null;

		return perms[tag].scope;
	}

	scopeView (tag) {
		return this.scope (tag, 'view');
	}
	scopeAdd (tag) {
		return this.scope (tag, 'add');
	}
	scopeRemove (tag) {
		return this.scope (tag, 'remove');
	}
	scopeEdit (tag) {
		return this.scope (tag, 'edit');
	}

	isViewScopeSingular (tag, singularKeys) {
		/* 
		 * singluarKeys are a set of keys that uniquely 
		 * define a single object in a set. They should
		 * correspond to the 'unique' keys in the schema.
		 * If all of them have a specific value (neither
		 * a wildcard '*' or a list), then they, together,
		 * define a 'single' object from the set.
		 */
		var scope = this.scope (tag, 'view');

		if (!scope)
			return true;

		if (!Array.isArray (singularKeys))
			return scope [singularKeys] !== '*' && !Array.isArray ( scope [singularKeys] );

		singularKeys.forEach((curr) => {
			if (scope [curr] === '*')
				return false;

			if (Array.isArray ( scope [curr] ))
				return false;
		});

		return true;
	}

	isInScope (verb, tag, obj) {
		var match = true;

		/* 
		 * singluarKeys are a set of keys that uniquely 
		 * define a single object in a set. They should
		 * correspond to the 'unique' keys in the schema.
		 * If all of them have a specific value (neither
		 * a wildcard '*' or a list), then they, together,
		 * define a 'single' object from the set.
		 */
		var scope = this.scope (tag, verb);

		if (!scope)
			return false;

		Object.keys (scope).forEach ((key) => {
			var value = scope [key];

			if (value === '*')
				return;

			if (!Array.isArray (value)) {
				if (obj[key] != value) {
					match = false;
					return;
				}
			}

			/*
			 * Array case not implemented */
		});

		return match;
	}

	isInEditScope (tag, obj) {
		return this.isInScope ('edit', tag, obj);
	}

	isInViewScope (tag, obj) {
		return this.isInScope ('view', tag, obj);
	}

	isInAddScope (tag, obj) {
		return this.isInScope ('add', tag, obj);
	}

	isInRemoveScope (tag, obj) {
		return this.isInScope ('remove', tag, obj);
	}
}

class ScopeToMongoQuery {
	constructor (map) {
		this.map = map;
	}

	toMongoQuery (scope) {
		if (!scope)
			throw 'no scope';

		var query = {};
		var scopeKeys = Object.keys (scope);

		for (var i = 0; i < scopeKeys.length; i++) {
			var scopeKey = scopeKeys[i];

			if (!this.map[scopeKey])
				throw new Error (`unknown scope key "${scopeKey}"`);

			if (scope[scopeKey] === '*')
				continue;

			if (!scope[scopeKey]) {
				query[ this.map[scopeKey] ] = { $exists : false };
				continue;
			}

			query[ this.map[scopeKey] ] = scope[scopeKey];
		}

		return query;
	}
}

module.exports = User;
module.exports.ScopeToMongoQuery = ScopeToMongoQuery;
