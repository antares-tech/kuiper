'use strict';

var fs         = require('fs');
var should     = require('should');
var rimraf     = require('rimraf');
var HOME       = process.env.HOME;
var Repository = require('../lib/repository');

describe('Repository', function() {

  var repo = null;

  before(function(ready) {
    if (fs.existsSync(HOME + '/.gitty')) {
      rimraf.sync(HOME + '/.gitty');
    }

    fs.mkdirSync(HOME + '/.gitty');
    fs.mkdirSync(HOME + '/.gitty/test');

    ready();
  });

  after(function() {
    rimraf.sync(HOME + '/.gitty/test');
  });

  describe('@constructor', function() {

    it('should create an instance', function(done) {
      repo = new Repository(HOME + '/.gitty/test');
      repo.should.be.instanceOf(Repository);
      repo.on('ready', done);
    });

    it('should mark itself as ready', function(done) {
      repo._ready.should.equal(true);
      done();
    });

    it('should not be a git repo', function(done) {
      repo.initialized.should.equal(false);
      done();
    });

    it('should reference an absolute path', function(done) {
      repo.path.should.equal(HOME + '/.gitty/test');
      done();
    });

    it('should have a name equal to the dirname', function(done) {
      repo.name.should.equal('test');
      done();
    });

    it('should define default \'largeOperations\'', function(done) {
      repo.largeOperations.should.containDeep(['log', 'ls-files']);
      done();
    });

    it('should define default \'largeOperationsMaxBuffer\'', function(done) {
      repo.largeOperationsMaxBuffer.should.equal(1024 * 5000);
      done();
    });

    it('should use specified \'gitpath\'', function(done) {
      var repo2 = new Repository(HOME + '/.gitty/test', '/myPathToGit');
      repo2.gitpath.should.equal('/myPathToGit');
      repo2.on('ready', done);
    });

    it('should use specified \'gitpath\' within gitpathOrOpts object',
      function(done) {

      var repo2 = new Repository(HOME + '/.gitty/test', {gitpath:'/myPathToGit'});
      repo2.gitpath.should.equal('/myPathToGit');
      repo2.largeOperations.should.containDeep(['log', 'ls-files']);
      repo2.largeOperationsMaxBuffer.should.equal(1024 * 5000);
      repo2.on('ready', done);
    });

    it('should use specified \'largeOperations\' within gitpathOrOpts object',
      function(done) {

      var repo2 = new Repository(HOME + '/.gitty/test', {
        largeOperations: ['log', 'ls-files', 'status', 'commit']
      });
      repo2.gitpath.should.equal('');
      repo2.largeOperations.should.containDeep(['log', 'ls-files', 'status',
                                                'commit']);
      repo2.largeOperationsMaxBuffer.should.equal(1024 * 5000);
      repo2.on('ready', done);
    });

    it('should use specified \'largeOperationsMaxBuffer\' within ' +
       'gitpathOrOpts object', function(done) {
      var repo2 = new Repository(HOME + '/.gitty/test', {
        largeOperationsMaxBuffer: 1024 * 10000
      });
      repo2.gitpath.should.equal('');
      repo2.largeOperations.should.containDeep(['log', 'ls-files']);
      repo2.largeOperationsMaxBuffer.should.equal(1024 * 10000);
      repo2.on('ready', done);
    });

    it('should use specified \'gitpath\', \'largeOperations\', and ' +
       '\'largeOperationsMaxBuffer\'', function(done) {
      var repo2 = new Repository(HOME + '/.gitty/test', {
        gitpath: '/myPathToGit',
        largeOperations: ['log', 'ls-files', 'status', 'commit'],
        largeOperationsMaxBuffer: 1024 * 10000
      });
      repo2.gitpath.should.equal('/myPathToGit');
      repo2.largeOperations.should.containDeep(['log', 'ls-files', 'status',
                                                'commit']);
      repo2.largeOperationsMaxBuffer.should.equal(1024 * 10000);
      repo2.on('ready', done);
    });

  });

});
