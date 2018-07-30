var mongoose = require ('mongoose');
var promise  = require ('bluebird');
var moment   = require ('moment');
var schedule = require ('node-schedule');
var bunyan   = require('bunyan');

promise.promisifyAll (mongoose);
mongoose.Promise = promise;
var Schema       = mongoose.Schema;

/* Logs */
var log = {};

if (process.env.NODE_ENV !== 'production') {
	log = bunyan.createLogger ({
		name : `3a`,
		streams : [
			{
				name : "stdout",
				stream : process.stdout,
				level  : 'debug'
			},
		/*	{
				name : "nats",
				level: bunyan.INFO,
				stream: nats.stream,
			}*/
		]
	});
}
else {
	/* This is production environment */
	log = bunyan.createLogger ({
		name : '3a',
		streams : [
			{
				type : "rotating-file",
				path : './logs/3a.log',
				level  : 'debug'
			},
		]
	});
}


/* Mongo DB Connection */
var db_path = 'mongodb://localhost:27017/nimble';
var db;

function init (url, options) {
	var _d = promise.pending();

	db = mongoose.createConnection (
		url,
		{
			server : {
				pool : 5,
				auto_reconnect : true
			}
		},
		function (err) {
			if (err) {
				console.error ({ url : url, err : err }, 'db connect failed');
				process.exit (1);
			}

			console.log ({ url:url }, 'db connected ok');
			_d.resolve (db);
		});

	return _d.promise;
}

function connect_db () {
	return new promise (async (resolve, reject) => {
		try {
			await init (db_path);
			return resolve (true);
		}
		catch (err) {
			return reject (`Error : ${err}`);
		}
	});
}

/* Validations */
function id_validate (id) {
    var obj = id.split(":");
    var user_id  = obj[0];
    var auth_via = obj[1];

    if (obj.length > 2)
        return false;

    if (!user_id || !auth_via)
        return false;

    if (user_id.match (/^[a-zA-Z0-9\-_.@\.]+$/) && auth_via.match (/^[a-zA-Z0-9\-_]+$/))
        return true;

    return false;
}

/* Summary mongo collection */
var summary_schema = new Schema (
	{
		userId           : { type : String, required : true, lowercase : true, validate: { validator: id_validate, message: 'Invalid id!' }, match : /^[a-zA-Z0-9\-_.@\.:]+$/ },
		driveId          : { type : String, required : true, lowercase : true, match : /^[a-zA-Z0-9\-_.@\.:]+$/ },
		score            : { type : Number, required : true },
		dist             : { type : Number },
		lbSuccess        : { type : Boolean, default : false },
		modifiedTs       : { type : Date },
		version          : { type : Number, default : 0 },
	}
);

/* Db functions */
summary_schema.statics.updateMany = function (userId) {
	return new promise (async (resolve, reject) => {
		try {
			var update = { lbSuccess : true, modifiedTs : moment().utc().toISOString() };
			var result = await this.update ({ userId }, { $set : update }, { multi : true });
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

summary_schema.statics.query = function (query) {
	return new promise (async (resolve, reject) => {
		try {
			var result = await this.aggregate (query);
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

/* Leaderboard Mongo Collection */
var leaderboard_schema = new Schema (
	{
		userId           : { type : String, required : true, lowercase : true, validate: { validator: id_validate, message: 'Invalid id!' }, match : /^[a-zA-Z0-9\-_.@\.:]+$/ },
		avgScore         : { type : Number, required : true },
		totalScore       : { type : Number, required : true },
		totalDist        : { type : Number, required : true },
		drives           : { type : Number, required : true },
		createdTs        : { type : Date, required : true },
		modifiedTs       : { type : Date },
		version          : { type : Number, default : 0 },
	}
);

/* Indexing */
leaderboard_schema.index ({ userId : 1 }, { unique : true });
leaderboard_schema.index ({ avgScore : -1, totalDist : -1 });

/* Db functions */
leaderboard_schema.statics.find = function (id, query = {}) {
	return new promise (async (resolve, reject) => {
		try {
			var result = await this.findOne ({ userId : id }).select (query);
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

leaderboard_schema.statics.add = function (data) {
	/* Adding required attributes */
	data.createdTs  = moment().utc().toISOString();

	return new promise (async (resolve, reject) => {
		try {
			var result = await this.create (data);
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

leaderboard_schema.statics.update = function (id, data) {
	/* Adding required attributes */
	data.modifiedTs = moment().utc().toString();

	return new promise (async (resolve, reject) => {
		try {
			var opts   = { runValidators : true };
			var result = await this.findOneAndUpdate ({ userId : id }, { $set : data }, opts);
			return resolve (result);
		}
		catch (err) {
			return reject (err);
		}
	});
};

/* get model */
function get_model (name) {
	var summary_model = db.model ('summary_data',     summary_schema);
	var lb_model      = db.model ('leaderboard_data', leaderboard_schema);

	switch (name) {
		case 'summary' : return summary_model;

		case 'leaderboard' : return lb_model;

		default : return 'Unknown';
	}
}

/* Main Function */
function main () {
	return new promise (async (resolve, reject) => {
		var total = 0, i = 0;
		try {
			if (!db)
				await connect_db ();

			var summary_model = get_model ('summary');
			var lb_model      = get_model ('leaderboard');
			var lb_query      = [{ $match : { lbSuccess : false }}, { $group : { _id : "$userId" }}];
			var failed_result = await summary_model.query (lb_query);

			total = failed_result.length;

			for (i = 0; i < total; i++) {
				var query = [
					{ $match : { userId : failed_result[i]['_id'] }},
					{ $group : { _id : "$userId", totalDist : { $sum : "$dist" }, totalScore : { $sum : "$score" }, avgScore : { $avg : "$score" }, count : { $sum : 1 }}}
				];
				var data = await summary_model.query (query);
				var lb   = await lb_model.find (failed_result[i]['_id']);

				var entry = {}, result, userId = data[0]['_id'];

				/* Common changes for add and update */
				entry["totalScore"] = data[0]['totalScore'];
				entry["totalDist"]  = data[0]['totalDist'];
				entry["drives"]     = data[0]['count'];
				entry["avgScore"]   = data[0]['avgScore'];

				if (!lb) {
					entry["userId"] = userId;
					result = await lb_model.add (entry);
				} else {
					result = await lb_model.update (userId, entry);
				}

				var update_summary = await summary_model.updateMany (userId);
			}

			var time = moment().utc().toISOString();
			log.info ({ total, updated : i, time }, 'Success.');
			return resolve (true);
		}
		catch (err) {
			var time = moment().utc().toISOString();
			log.error ({ total, updated : i, time, err }, 'Failed.')
			return reject (false);
		}
	});
}

schedule.scheduleJob ('0 0 * * * *', async function() {
	await main ();
});
