# Gitty

[![Build Status](https://travis-ci.org/gordonwritescode/gitty.svg)](https://travis-ci.org/gordonwritescode/gitty)

Gitty is a Node.js wrapper for Git. It's syntax resembles the Git command line
syntax, executes common commands, and parses the output into operable objects.

**[Complete documentation is available here.](http://bookch.in/gitty/)**

## Installation

### Prerequisites

* Node.js 0.12.x (http://nodejs.org)
* Git 1.7.x.x (http://git-scm.com)

```
$ npm install gitty
```

### Testing

Run the the unit and integration tests with:

```
$ npm test
```

## Usage

```js
var git    = require('gitty');

// identifying the repo and using defaults
var myRepo = git('/path/to/repo');

// explicitly passing the path to the git client
var myRepo2 = git('/path/to/repo2', '/not-in-path/bin/git');

// specifying an options object (note all properties are optional)
var myRepo3 = git('/path/to/repo3', {
  gitpath: '/not-in-path/bin/git',                          // optional
  largeOperations: ['log', 'ls-files', 'status', 'commit'], // optional
  largeOperationsMaxBuffer: 1024 * 6000                     // optional
});
```

Now you can call this instance of `Repository`'s methods. For example, to
execute `git log` for `myRepo`, you would do:

```javascript
myRepo.log(function(err, log) {
	if (err) return console.log('Error:', err);
	// ...
});
```

## Authenticated Repositories

Gitty no longer supports username/password authentication over SSH. You should
be using SSH keys for that.

```javascript
myRepo.push('origin', 'master', function(err, succ) {
	if (err) return console.log(err);
	// ...
});
```

## Author

Gitty was written by Gordon Hall (gordon@gordonwritescode.com)  
Licensed under LGPLv3 license
