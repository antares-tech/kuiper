var readline = require ('readline');
var minimist = require ('minimist');
var promise  = require ('bluebird');
var colors   = require ('colors');
var events   = require ('events');
var protocol = require ('common/protocol');
var parser   = require ('./parser');
var exec     = require ('./commands');
var utils    = require ('./utils');
var print    = require ('./print');

var argv = minimist (process.argv.slice(2));
var vm = {};
var emitter = new events ();
var sub_commands = {};

vm.exec = async function (parsed_lines, context) {
	var _d = promise.pending ();
	var parsed_line;

	try {
		for (var i = 0; i < parsed_lines.length; i++) {
			parsed_line = parsed_lines[i];
			var result = await vm.exec_one (parsed_line, context);

			if (result && result.exit)
				break;
		}
		_d.resolve ();
	}
	catch (e) {
		var err = e;

		if (e instanceof Error)
			err = e.message;
		else if (typeof e === 'object')
			err = print.stringify (e, null, 2);

		console.log (colors.red (`vm.exec : exception executing "${print.stringify (parsed_line)}"`));
		console.log (`${err}`);
		if (e.stack)
			console.log (e.stack);

		_d.reject (e);
	}

	return _d.promise;
};

vm.exec_one = async function (parsed_line, context) {
	/*
	 * Format of the parsed_line:
	 *     variable : xxx,
	 *     expr | command : yyy
	 */
	var _d = promise.pending ();
	var variable          = parsed_line.variable;
	var expr              = parsed_line.expr;
	var command           = parsed_line.command;
	var sub_command_block = parsed_line.sub_command_block;
	var options           = {};

	try {

		/*
		 * Create a placeholder for the variable in the global context */
		if (!context.variables [ variable ])
			context.variables [ variable ] = {};

		if (expr) {
			context.variables [ variable ] = evaluate_expr (expr, context);

			if (context.show_commands)
				display_assignment (variable, expr);

		} else if (command) {
			var __args = command.args, args = {};

			/*
			 * Evaluate all arguments */
			if (__args)
				for (var i = 0; i < __args.length; i++)
					args [ __args [ i ].arg ] = evaluate_expr (__args [ i ].expr, context);

			/*
			 * if this statement has a sub command block, then
			 * it will get triggered later. Set the emitter */
			if (sub_command_block)
				options.emitter = emitter;
			/*
			 * This _could_ be the sub command block excuting.
			 * Set the message that triggered it. Also set it
			 * in the context for the script to use. */
			if (context.trigger_data) {
				options.trigger_data = context.trigger_data;
				context.variables [ '$$in_msg' ]     = context.trigger_data.msg;
				context.variables [ '$$reply_to' ]   = context.trigger_data.reply_to;
				context.variables [ '$$in_channel' ] = context.trigger_data.channel;
			}

			/*
			 * Add the current context to the options */
			options.context = context;

			if (context.show_commands)
				display_command (variable, command.command, __args);

			/*
			 * Call the actual command */
			var result = await exec (command.command, options, args);

			if (result.return_value) {
				/*
				 * The response can be either of the "protocol" class or
				 * any other. */
				if (result.response.toObject)
					context.variables [ variable ] = result.response.toObject ();
				else
					context.variables [ variable ] = result.response;
			}

			if (result.response && result.response.type && result.response.type === 'not-ok') {
				console.log (colors.red ('response not-ok : ') + result.response.reason);

				if (!argv['no-abort-on-nack'])
					throw `response "not-ok" for command "${command.command}" : ${result.response.reason}`;
			}

			if (argv['show-request'] && result.request)
				utils.print_pdu (result.request, 'out', result.transport);

			if ((argv['show-response'] || args['show-response']) && result.response) {
				if (result.response instanceof protocol)
					utils.print_pdu (result.response, 'in', result.transport);
				else
					console.log (colors.dim (print.stringify (result.response, null, 2)));
			}

			/*
			 * if the command has a sub command block, then link it */
			if (sub_command_block) {

				if (!result.callback_event)
					throw 'expected "callback_event" but did not get it';

				var child_context = {
					parent_context : context,
					variables : {},
				};

				sub_commands [ result.callback_event ] = {
					context : child_context,
					commands : sub_command_block
				};

				emitter.on (result.callback_event, async function (data) {
					var sub = sub_commands [ result.callback_event ];
					var commands = sub.commands;
					var _context = sub.context;

					_context.trigger_data  = data;
					_context.show_commands = true;

					/*
					 * If there's a message then also store it in
					 * the context's variable as $msg */
					if (data.msg)
						_context.variables['$msg'] = data.msg;

					try {
						await vm.exec (commands, _context);
					}
					catch (e) {
						/* Trigger exit */
						utils.exit (null, { status : 'fail' });
					}
				});
			}
		}

		_d.resolve (result);
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

function evaluate_expr (expr, context) {
	if (expr.type === 'string')
		return  expr.value;
	if (expr.type === 'boolean')
		return  expr.value;
	if (expr.type === 'number')
		return  expr.value;
	if (expr.type === 'js')
		return  js_eval (expr.value, context);

	throw 'unrecognized expression type : ' + expr.type;
}

function js_eval_old (_js, context) {
	/*
	 * Get a list of all variable references */
	var regex = new RegExp (/(\$[a-zA-Z_][a-zA-Z0-9_]*)/g);

	var js = _js.replace (regex, 'context.variables.$1')
	var value = null;

	try {
		value = eval (js);
		if (argv[ 'show-js-eval' ])
			console.log (colors.dim (`[ js-debug ] evaluating "${_js}" (translated to "${js}") to ${typeof value === 'object' ? JSON.stringify (value) : value}`));
	}
	catch (e) {
		var err = e;

		if (e instanceof Error)
			err = e.message;

		throw (colors.red ('evaluating ' + '"' + _js + '" failed : ') + err);
	}
	return value;
}
function js_eval (_js, context) {
	/*
	 * Get a list of all variable references */
	var refs = _js.match (/\$[a-zA-Z_][a-zA-Z0-9_]*/g);
	var map = {}, js = _js;

	refs && refs.forEach (function (curr) {
		var __context = context;
		var replace_prefix = 'context.';
		var regex = new RegExp ('\\' + curr, 'g');

		do {
			if (__context && __context.variables [ curr ]) {
				js = js.replace (regex, replace_prefix + 'variables.'+ curr);
				return;
			}

			__context = __context.parent_context;
			replace_prefix = replace_prefix + 'parent_context.';

		} while (__context);

		/*
		 * If we come here, it means we didn't find the variable 
		 * in any context */

		throw `undefined variable "${curr}"`;
	});

	var value = null;

	try {
		value = eval (js);
		if (argv[ 'show-js-eval' ])
			console.log (colors.dim (`[ js-debug ] evaluating "${_js}" (translated to "${js}") to ${typeof value === 'object' ? print.stringify (value, null, 2) : value}`));
	}
	catch (e) {
		var err = e;

		if (e instanceof Error)
			err = e.message;

		throw (colors.red (`evaluating "${_js}" (translated to "${js}") failed : ${err}`));
	}
	return value;
}

function display_assignment (variable, expr) {
	console.log (colors.yellow (`+ ${variable} << ${expr.value}`));
}

function display_command (variable, command, args) {
	var __arguments = '';

	if (args)
		args.forEach (function (curr) {
			let key   = curr.arg;
			let value = curr.expr.value;
			__arguments += ` ${key} ${value}`
		});

	console.log (colors.yellow (`+ ${variable ? variable + " << " : ""}${command}${__arguments}`));
}

module.exports = vm;
