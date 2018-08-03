/**
* @module gitty/parser
*/

'use strict';

/**
* @function
* @param {string} output
* @return {string}
*/
module.exports.log = function(output) {
  var log = '[' + output.substring(0, output.length - 1) + ']';

  // this function cleans the commit log from any double quotes breaking the
  // JSON string

  var jsonValueRegex = /".*?":"(.*?)"[,}]/g;

  var h = log.match(jsonValueRegex);

  if (h) {
    for (var i = h.length - 1; i >= 0; i--) {
      var hh = h[i].replace(jsonValueRegex, '$1');
      var hhh = hh.replace(/\"/g, '\\"').replace(/\'/g, '');

      log = log.replace(hh, hhh);
    }
  }

  return JSON.parse(log);
};

/**
* Output Handler for GIT status
* @function
* @param {string} gitstatus
* @param {string} untracked
* @return {string}
*/
module.exports.status = function(gitstatus, untracked) {
  untracked = untracked.split('\n');

  var fileStatus = null;
  var output = gitstatus.split('\n');

  var status = {
    staged: [],
    unstaged: [],
    untracked: untracked.slice(0, untracked.length - 1),
    ahead: 0,
    behind: 0,
    diverged: false
  };

  // iterate over lines
  output.forEach(function(line) {

    // switch to staged array
    if (line.match(/changes to be committed/i)) {
      fileStatus = 'staged';
    }
    // or switch to not_staged array
    else if (line.match(/changes not staged for commit/i)) {
      fileStatus = 'unstaged';
    }
    // or switch to untracked array
    else if (line.match(/untracked files/i)) {
      fileStatus = 'untracked';
    }
    var isAhead = line.match(/is ahead.+by (\d+)/i);
    var isBehind = line.match(/is behind.+by (\d+)/i);
    var haveDiverged = line.match(/and have (\d+) and (\d+) different/i);
    var isModified = line.match(/modified/i);
    var isNewFile = line.match(/new file/i);
    var isDeleted = line.match(/deleted/i);

    if (isBehind) {
      status.behind = parseInt(isBehind[1]);
    }
    if (isAhead) {
      status.ahead = parseInt(isAhead[1]);
    }

    if (haveDiverged) {
      status.diverged = true
      status.ahead = parseInt(haveDiverged[1])
      status.behind = parseInt(haveDiverged[2])
    }
    // check if the line contains a keyword
    if (isModified || isNewFile || isDeleted) {
      // then remove # and all whitespace and split at the colon
      var fileinfo = line.substr(1).trim().split(':');
      // push a new object into the current array
      status[fileStatus].push({
        file: fileinfo[1].trim(),
        status: fileinfo[0]
      });
    }
  });

  return status;
};

/**
* Output handler for git commit
* @function
* @param {string} output
* @return {string}
*/
module.exports.commit = function(output) {
  var commitFailed = (output.indexOf('nothing to commit') > -1 ||
                      output.indexOf('no changes added to commit') > -1);

  // if there is nothing to commit...
  if (commitFailed) {
    return {
      error: (function(output) {
        var lines = output.split('\n');
        for (var ln = 0; ln < lines.length; ln++) {
          if (lines[ln].indexOf('#') === -1) {
            return lines[ln];
          }
        }
      })(output)
    };
  }

  var splitOutput = output.split('\n');
  var branchAndHash = splitOutput[0].match(/\[([^\]]+)]/g)[0];
  var branch = branchAndHash.substring(1, branchAndHash.length - 1);
  var hash = branchAndHash.substring(1, branchAndHash.length - 1);
  var filesChanged = splitOutput[1].split(' ')[0];
  var operations = splitOutput.splice(2);

  return {
    branch: branch.split(' ')[0],
    commit: hash.split(' ')[1],
    changed: filesChanged,
    operations: operations
  };
};

/**
* Output handler for git branch command
* @function
* @param {string} output
* @return {string}
*/
module.exports.branch = function(output) {
  var tree = { current: null, others: [] };
  var branches = output.split('\n');

  branches.forEach(function(val, key) {
    if (val.indexOf('*') > -1) {
      tree.current = val.replace('*', '').trim();
    }
    else if (val) {
      tree.others.push(val.trim());
    }
  });

  return tree;
};

/**
* Output handler for git tag command
* @function
* @param {string} output
* @return {string}
*/
module.exports.tag = function(output) {
  var tags = output.split(/\r?\n/);

  for (var i = 0; i < tags.length; i++) {
    if (!tags[i].length) {
      tags.splice(i, 1);
    }
  }

  return tags;
};

/**
* Output handler for git remote -v command
* @function
* @param {string} output
* @return {string}
*/
module.exports.remotes = function(output) {
  var list = {};
  var parseme = output.split('\n');

  parseme.forEach(function(val, key) {
    if (val.split('\t')[0]) {
      list[val.split('\t')[0]] = val.split('\t')[1].split(' ')[0];
    }
  });

  return list;
};

/**
* Output handler for git errors from git push and pull commands
* @function
* @param {string} output
* @return {string}
*/
module.exports.syncErr = function(output) {
  var result = output.split('\r\n');

  for (var i = 0; i < result.length; i++) {
    if (!result[i].length) {
      result.splice(i, 1);
    }
  }

  return result;
};

/**
* Output handler for git success messages from git push and pull commands
* @function
* @param {string} output
* @return {string}
*/
module.exports.syncSuccess = function(output) {
  return output;
};
