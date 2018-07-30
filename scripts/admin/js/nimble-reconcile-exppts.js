#!/usr/bin/env node

var mongoose = require ('mongoose');
var promise  = require ('bluebird');

var user_db = 'mongodb://localhost:27017/user';
var nimble_db = 'mongodb://localhost:27017/nimble';
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

function connect_db (url) {
	return new promise (async (resolve, reject) => {
		try {
			var db = await init (url);
			return resolve (db);
		}
		catch (err) {
			return reject (`Error : ${err}`);
		}
	});
}

function get_all_users () {
	return new promise (async (resolve, reject) => {
		try {
			var userDb = await connect_db (user_db);
			var user_col = userDb.collection('datas');
	
			user_col.find ({}).toArray(function (err, all_users) {
				if (err)
					throw err;

				var user_map = {};

				for (var i = 0; i < all_users.length; i++)
					user_map[all_users[i].id] = all_users[i];

				return resolve (user_map);
			});
		}
		catch (err) {
			return reject (`Error : ${err}`);
		}
	});
}

function lb_update (col, id, data) {
	return new promise ((resolve, reject) => {
		col.update ({ userId : id }, { $set : data }, function (err) {
			if (err)
				return reject (err);

			return resolve (true);
		});
	});
}

function get_expPts_avgScore (col) {
	return new promise (async (resolve, reject) => {
		try {
			var user_map = await get_all_users ();

			col.find ({}).toArray(function (err, lb_entries) {
				if (err)
					throw err;

				var data_arr = [];

				for (var i = 0; i < lb_entries.length; i++) {
					var lb_ent = lb_entries[i];
					var user_data = user_map[lb_ent.userId] || null;
					var custom  = user_data && user_data['custom'] && user_data['custom']['nimble'] && user_data['custom']['nimble']['data'] || null;
					var expPts = custom && custom['expPts'] || 0;
					var newScore = Math.round (lb_ent.avgScore * 10) / 10;
					
					data_arr.push ({ userId : lb_ent.userId , expPts : expPts, avgScore : newScore });
				}

				return resolve (data_arr);
			});
		}
		catch (err) {
			return reject (`Error in update_exp : ${err}`);
		}
	});
}

function update_func () {
	return new promise (async (resolve, reject) => {
		try {
			var nimbleDb = await connect_db (nimble_db);
			var lb_col   = nimbleDb.collection('leaderboard_datas');
			var data = await get_expPts_avgScore (lb_col);
			
			for (var i = 0; i < data.length; i++) {
				var _data = data[i];
				var id = _data.userId;
				var updated_data = {
					expPts : _data.expPts,
					avgScore : _data.avgScore
				};

				await lb_update (lb_col, id, updated_data);
			}

			return resolve (true);
		}
		catch (err) {
			return reject (`Error in update : ${err}`);
		}
	});
}

async function start () {
	await update_func ();
	process.exit (0);
}

start ();
