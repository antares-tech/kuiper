'use strict';

var childproc = require('child_process');
var exec = childproc.exec;
var execSync = childproc.execSync;
var utils = require('./utils');

/**
* Setup function for running git commands on the command line
* @constructor
* @param {Repository|string} repo or a string identifying the repo
* @param {string} operation
* @param {array}  flags
* @param {string} options
*/
var Command = function(repo, operation, flags, options) {
  flags = flags || [];
  options = options || '';

  // Some operations on very large repos or long-lived repos will
  // require more stdout buffer. The default (200K) seems sufficient
  // for most operations except for 'log'.
  this.execBuffer = 1024 * 200;

  if (utils.isObject(repo)) {
    this.repo = repo;
    var largeOperations = repo.largeOperations || ['log', 'ls-files'];
    if (largeOperations.indexOf(operation) > -1) {
      this.execBuffer = repo.largeOperationsMaxBuffer || 1024 * 5000;
    }
  } else if (utils.isString(repo)) {
    this.repo = { path: repo, gitpath: '' };
  } else {
    this.repo = { path: '/', gitpath: '' };
  }
  this.command = (this.repo.gitpath ? this.repo.gitpath + ' ' : 'git ') +
    operation + ' ' + flags.join(' ') + ' ' + options;
};

/**
* Executes the stored operation in the given path
* @param {function} callback
*/
Command.prototype.exec = function(callback) {
  return exec(this.command, this._getExecOptions(), callback);
};

/**
* Executes the stored operation in the given path syncronously
*/
Command.prototype.execSync = function() {
  process.chdir(this.repo.path);
  return execSync(this.command, this._getExecOptions()).toString();
};

/**
* Return options to be passed to exec/execSync
* @private
*/
Command.prototype._getExecOptions = function() {
  return {
    cwd: this.repo.path,
    maxBuffer: this.execBuffer
  };
};

module.exports = Command;
