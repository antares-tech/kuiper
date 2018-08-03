'use strict';

var fs       = require('fs');
var should   = require('should');
var rimraf   = require('rimraf');
var HOME     = process.env.HOME;
var Gitty    = require('../index');
var pushover = require('pushover');

describe('Gitty', function() {

  before(function(ready) {
    if (fs.existsSync(HOME + '/.gitty')) {
      rimraf.sync(HOME + '/.gitty');
    }

    fs.mkdirSync(HOME + '/.gitty');
    fs.mkdirSync(HOME + '/.gitty/clonefrom');
    fs.writeFileSync(HOME + '/.gitty/clonefrom/file', 'o hai');

    var repo  = Gitty(HOME + '/.gitty/clonefrom');
    var repos = pushover(HOME + '/.gitty');

    repo.initSync();
    repo.addSync(['.']);
    repo.commitSync('initial commit');

    repos.on('fetch', function(fetch) {
      fetch.accept();
    });

    require('http').createServer(function(req, res) {
      repos.handle(req, res);
    }).listen(7000, function() {
      ready();
    });
  });

  describe('.getConfig()', function() {

    it('should return a value from the global git config', function(done) {
      Gitty.getConfig('user.name', function(err, username) {
        should.not.exist(err);
        should.exist(username);
        done();
      });
    });

  });

  describe('.getConfigSync()', function() {

    it('should return a value from the global git config', function(done) {
      should.exist(Gitty.getConfigSync('user.name'));
      done();
    });

  });

  describe('.setConfig()', function() {

    it('should set a value to the global git config', function(done) {
      var value = Date.now();
      Gitty.setConfig('gitty.integ.test', value, function(err) {
        should.not.exist(err);
        Gitty.getConfigSync('gitty.integ.test').trim().should.equal(
          value.toString()
        );
        done();
      });
    });

  });

  describe('.setConfigSync()', function() {

    it('should return a value from the global git config', function(done) {
      var value = Date.now();
      Gitty.setConfigSync('gitty.integ.test', value);
      Gitty.getConfigSync('gitty.integ.test').trim().should.equal(
        value.toString()
      );
      done();
    });

  });

  describe('.clone()', function() {

    it('should clone the repository', function(done) {
      var url = 'http://localhost:7000/clonefrom';

      Gitty.clone(HOME + '/.gitty/cloneto', url, function(err) {
        should.not.exist(err);
        fs.exists(HOME + '/.gitty/cloneto/file', function(exists) {
          exists.should.equal(true);
          done();
        });
      });
    });

  });

});
