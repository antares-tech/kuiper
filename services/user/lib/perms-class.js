var log  = require ('common/log').child({ module : 'lib/perms-class' });
var safeJSONParse  = require ('safe-json-stringify');

var refRegEx = new RegExp (/^\{([^{}]+)\}$/g); /* Supposed to match "{string}" or "{string.string}" */

class Perms {

	constructor (in_perms) {
		this.original = in_perms;
		this.validate ();
	}

	forDB () {
		return this.original;
	}

	validate () {
		Object.keys(this.original).forEach ((tag) => {

			switch (tag) {
				case 'flags':
					this.validateFlags (tag);
					break;

				default:
					this.validateTag (tag);
					break;
			}
		});
	}

	validateFlags (tag) {
		Object.keys(this.original[tag]).forEach((key) => {
			switch (key) {
				case 'admin3a':
					break;

				default:
					throw new Error (`unknown key "${key}" in tag "${tag}"`);
			}
		});
	}

	validateTag (tag) {
		Object.keys(this.original[tag]).forEach((verbOrScope) => {
			
			switch (verbOrScope) {

				case 'scope':
					return this.validateScope (this.original[tag][verbOrScope], tag);

				case 'add':
				case 'edit':
				case 'remove':
				case 'view':
					return this.validateVerb (this.original[tag][verbOrScope]);

				default :
					throw new Error (`unknown verb "${verbOrScope}" in tag "${tag}"`);
			}
		});
	}

	validateScope (scope, tag) {

		if (!scope)
			return;

		Object.keys(scope).forEach ((key) => {

			var scopeItem = scope[key];
			/*
			 * A scopeItem can of the following types:
			 * 	* | :self={<string>} | $expr(expr) | [ list ] 
			 */

			if (!scopeItem)
				return;

			if (typeof scopeItem === 'string') {
				if (scopeItem === '*')
					return;

				if (scopeItem.match(/^:self=/g))
					return this.validateSelfExpr (scopeItem);

				if (scopeItem.match (/^:ref=/g))
					return;

				throw new Error (`unknown scopeItem value "${scopeItem}" for "${key}"`);
			}

			if (Array.isArray (scopeItem)) {
				scopeItem.forEach ((curr) => {
					if (typeof curr !== 'string')
						throw new Error (`unknown type for scopeItem value in array for "${key}"`);
				});

				return;
			}

			throw new Error (`unknown type for scopeItem value, key = "${key}"`);
		});
	}

	validateSelfExpr (scopeItem) {
		var s = scopeItem.split('=')[1];

		/*
		 * should be of the form {string}
		 */
		if (!s || !s.match(refRegEx)) {
			throw new Error (`invalid scopeItem "${scopeItem}"`);
		}

		return;

	}

	validateRef (scopeItem, key, tag) {
		/*
		 * A ref is of the form ":ref={reference}
		 */
		var ref = scopeItem.split('=')[1];

		if (!ref)
			throw `malformed ref: scopeItem "${scopeItem}"`;

		ref = ref.replace(refRegEx, "$1");

		if (!ref)
			throw 'empty ref: scopeItem';

		var tag        = ref.split('.')[0];
		var scopeKey   = ref.split('.')[1];

		if (!this.original[tag] || !this.original[tag].scope || !this.original[tag].scope[scopeKey])
			throw `unresolved ref: for "${ref}" in tag "${tag}", scopeItem "${key}" => "${scopeItem}"`;
	}

	validateVerb (verb) {
		if (!verb)
			return;

		if (typeof verb.allowed !== 'boolean')
			throw new Error (`unexpected type for "allowed" in verb "${verb}". expected boolean`);

		if (verb.scope)
			return this.validateScope (verb.scope);
	}

	resolveScopes (user) {
		/*
		 * Pass one
		 */
		this.user = user;

		this.pass ({ resolveSelf : true });
		this.pass ({ resolveRefs : true });

		return this.original;
	}

	pass (options) {

		Object.keys (this.original).forEach ((tag) => {
			/*
			 * Skip the special tag "flags"
			 */
			if (tag === 'flags')
				return;

			var scope = this.original[tag].scope;

			if (!scope)
				return;

			Object.keys (scope).forEach ((key) => {
				var scopeItem = scope[key];

				if (!scopeItem) {
					return;
				}

				if (Array.isArray (scopeItem)) {
					return;
				}

				if (typeof scopeItem !== 'string')
					return;

				if (scopeItem === '*') {
					return;
				}

				if (options.resolveSelf && scopeItem.match(/^:self=/g))
					return this.resolveSelfExpr (scope, key, scopeItem);

				if (options.resolveRefs && scopeItem.match (/^:ref=/g))
					return this.resolveRefsExpr(scope, key, scopeItem);

			});
		});
	}

	resolveSelfExpr (scope, key, scopeItem) {
		var s = scopeItem.split('=')[1];

		/*
		 * should be of the form {string}
		 */
		var expr = s.replace (refRegEx, "$1");
		if (!expr) {
			var err = new Error (':self ref resolution failed. ignoring. will result in unusual user permissions');
			log.error ({ scope : scope, scopeItem : scopeItem, err : err, stack : err.stack });
			return;
		}

		if (!this.user[expr]) {
			var err = new Error (`:self ref warning : no field in user named "${expr}"`);
			log.error ({ scope : scope, scopeItem : scopeItem, err : err, stack : err.stack });
			/* Continue anyways */
		}

		scope[key] = this.user[expr];
	}

	resolveRefsExpr (scope, key, scopeItem) {
		var s = scopeItem.split('=')[1];

		/*
		 * should be of the form {string}
		 */
		var expr = s.replace (refRegEx, "$1");
		if (!expr) {
			var err = new Error (':ref resolution failed. ignoring. will result in unusual user permissions');
			log.error ({ scope : scope, scopeItem : scopeItem, err : err, stack : err.stack });
			return;
		}

		var tag        = expr.split('.')[0];
		var scopeKey   = expr.split('.')[1];

		var referredScope = this.original[tag] &&
							this.original[tag].scope &&
							this.original[tag].scope[scopeKey];

		if (!referredScope) {
			var err = new Error (`:ref ref warning : no tag or empty scope for referred "${expr}"`);
			log.warn ({ scope : scope, scopeItem : scopeItem, err : err, stack : err.stack });
		}

		scope[key] = referredScope;
	}
};

module.exports = Perms;
