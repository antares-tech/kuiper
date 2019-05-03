var is_dirty = require('is-dirty');
var git_rev  = require('git-rev');
var Err      = require('common/3a-error');
var log      = require('common/log');

var revision = {};

revision.get = function (req, res, next) {
	get_revision ()
		.then (
			function (__revision) {
				return res.status (200).send (__revision);
			},
			function (err) {
				log.error ({ err : err }, 'got revisions request')
				var E = new Err ('SERVER_ERR', 500, 'git revision get : ' + err);
				return res.status (500).send (E.serialize ());
			}
		);
};

async function get_revision () {
	return new Promise (async (resolve, reject) => {
		try {
			var Dirty  = isDirty ();
			var Short  = get_short ();
			var Tag    = get_tag ();
			var Branch = get_branch ();

			return resolve ({
				tag    : await Tag,
				short  : await Short,
				branch : await Branch,
				state  : await Dirty
			});
		}
		catch (e) {
			log.error ({ err : e }, 'get_revision error');
		}
	});
}

function isDirty () {
	return new Promise (async (resolve, reject) => {

		is_dirty ('../../', function (err, status) {
			if (err) {
				log.error ({ err : err }, 'isDirty')
				return reject (err);
			}

			return resolve (status ? 'not-clean' : 'clean');
		});
	});
}

function get_short () {
	return new Promise ((resolve, reject) => {
		git_rev.short(function (commit) {
			resolve (commit);
		});
	});
}

function get_tag () {
	return new Promise ((resolve, reject) => {
		git_rev.tag(function (commit) {
			resolve (commit);
		});
	});
}

function get_branch () {
	return new Promise ((resolve, reject) => {
		git_rev.branch(function (commit) {
			resolve (commit);
		});
	});

}

module.exports = revision;
