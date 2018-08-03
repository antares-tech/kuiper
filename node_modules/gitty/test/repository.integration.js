'use strict';

var fs         = require('fs');
var should     = require('should');
var rimraf     = require('rimraf');
var HOME       = process.env.HOME;
var Repository = require('../lib/repository');
var pushover   = require('pushover');

describe('Repository', function() {

  var repo1 = null;
  var repo2 = null;
  var repo3 = null;

  before(function(ready) {
    if (fs.existsSync(HOME + '/.gitty')) {
      rimraf.sync(HOME + '/.gitty');
    }

    fs.mkdirSync(HOME + '/.gitty');
    fs.mkdirSync(HOME + '/.gitty/test1');
    fs.mkdirSync(HOME + '/.gitty/test2');
    fs.mkdirSync(HOME + '/.gitty/test3');

    repo1 = new Repository(HOME + '/.gitty/test1');
    repo2 = new Repository(HOME + '/.gitty/test2');

    var repos = pushover(HOME + '/.gitty');

    repos.on('push', function(push) {
      push.accept();
    });

    require('http').createServer(function(req, res) {
      repos.handle(req, res);
    }).listen(7001, function() {
      ready();
    });
  });

  after(function() {
    this.timeout(10000);
    rimraf.sync(HOME + '/.gitty/test1');
    rimraf.sync(HOME + '/.gitty/test2');
    rimraf.sync(HOME + '/.gitty/test3');
  });

  describe('.init()', function() {

    it('should initialize the new repository', function(done) {
      repo1.init(function(err) {
        should.not.exist(err);
        repo1.initialized.should.equal(true);
        done();
      });
    });

    it('should reinitialize the existing repository', function(done) {
      repo1.init(function(err) {
        should.not.exist(err);
        done();
      });
    });

  });

  describe('.initSync()', function() {

    it('should initialize the new repository', function(done) {
      repo2.initSync().should.equal(true);
      done();
    });

    it('should reinitialize the existing repository', function(done) {
      repo2.initSync().should.equal(true);
      done();
    });

  });

  describe('.status()', function() {

    it('should show a new file in status', function(done) {
      fs.writeFile(repo1.path + '/File.txt', 'I am a file.', function(err) {
        repo1.status(function(err, status) {
          should.not.exists(err);
          (status.untracked.indexOf('File.txt') === 0).should.equal(true);
          done();
        });
      });
    });

  });

  describe('.statusSync()', function() {

    it('should show a new file in status', function(done) {
      fs.writeFileSync(repo2.path + '/File.txt', 'I am a file.');
      (repo2.statusSync().untracked.indexOf('File.txt') === 0).should.equal(true);
      done();
    });

  });

  describe('.add()', function() {

    it('should stage a file for commit', function(done) {
      repo1.add(['File.txt'], function(err) {
        should.not.exist(err);
        repo1.status(function(err, status) {
          should.not.exists(err);
          status.staged.should.have.lengthOf(1);
          status.staged[0].file.should.equal('File.txt');
          done();
        });
      });
    });

  });

  describe('.addSync()', function() {

    it('should stage a File for commit', function(done) {
      repo2.addSync(['File.txt']);
      repo2.statusSync().staged.should.have.lengthOf(1);
      repo2.statusSync().staged[0].file.should.equal('File.txt');
      done();
    });

  });

  describe('.commit()', function() {

    it('should commit the working tree', function(done) {
      repo1.commit('initial commit', function(err) {
        should.not.exist(err);
        repo1.status(function(err, status) {
          should.not.exist(err);
          status.staged.should.have.lengthOf(0);
          status.unstaged.should.have.lengthOf(0);
          status.untracked.should.have.lengthOf(0);
          done();
        });
      });
    });

  });

  describe('.commitSync()', function() {

    it('should commit the working tree', function(done) {
      repo2.commitSync('initial commit');
      var status = repo2.statusSync();
      status.staged.should.have.lengthOf(0);
      status.unstaged.should.have.lengthOf(0);
      status.untracked.should.have.lengthOf(0);
      done();
    });

  });

  describe('.log()', function() {

    it('should get the commit log', function(done) {
      repo1.log(function(err, log) {
        should.not.exist(err);
        log.should.have.lengthOf(1);
        log[0].message.should.equal('initial commit');
        done();
      });
    });

    it('should be able to parse commit messages with quotation marks', function(done) {

      //add a file so something can be committed
      fs.writeFileSync(repo1.path + '/testFile.txt', 'i am a file');
      repo1.addSync(['testFile.txt']);

      var commitMessage = 'this commit shouldn\'t fail due to apostrophe, or "quotation marks';

      repo1.commitSync(commitMessage.replace(/\"/g, '\\"').replace(/\'/g, '\''));

      repo1.log(function(err, log) {
        should.not.exist(err);
        log.should.have.lengthOf(2);
        repo1.resetSync(log[1].commit); //reset the commit
        done();
      });

    });

  });

  describe('.logSync()', function() {

    it('should get the commit log', function(done) {
      var log = repo2.logSync();
      log.should.have.lengthOf(1);
      log[0].message.should.equal('initial commit');
      done();
    });

  });

  describe('.unstage()', function() {

    it('should unstage a file from commit', function(done) {
      fs.writeFile(repo1.path + '/File.txt', 'modified file', function(err) {
        repo1.add(['File.txt'], function(err) {
          repo1.unstage(['File.txt'], function(err) {
            should.not.exist(err);
            repo1.status(function(err, status) {
              status.unstaged.should.have.lengthOf(1);
              status.unstaged[0].file.should.equal('File.txt');
              done();
            });
          });
        });
      });
    });

  });

  describe('.unstageSync()', function() {

    it('should unstage a file from commit', function(done) {
      fs.writeFileSync(repo2.path + '/File.txt', 'modified file');
      repo2.addSync(['File.txt']);
      repo2.unstageSync(['File.txt']);
      repo2.statusSync().unstaged.should.have.lengthOf(1);
      repo2.statusSync().unstaged[0].file.should.equal('File.txt');
      done();
    });

  });

  describe('.remove()', function() {

    it('should remove an added file', function(done) {
      fs.writeFile(repo1.path + '/File1.txt', 'i am a file', function(err) {
        repo1.add(['File1.txt'], function(err) {
          repo1.remove(['File1.txt'], function(err) {
            should.not.exist(err);
            repo1.status(function(err, status) {
              status.untracked.should.have.lengthOf(1);
              status.untracked[0].should.equal('File1.txt');
              done();
            });
          });
        });
      });
    });

  });

  describe('.removeSync()', function() {

    it('should remove an added file', function(done) {
      fs.writeFileSync(repo2.path + '/File1.txt', 'i am a file');
      repo2.addSync(['File1.txt']);
      repo2.removeSync(['File1.txt']);
      repo2.statusSync().untracked.should.have.lengthOf(1);
      repo2.statusSync().untracked[0].should.equal('File1.txt');
      done();
    });

  });

  describe('.createBranch()', function() {

    it('should create a new branch', function(done) {
      repo1.createBranch('test', function(err) {
        should.not.exist(err);
        repo1.getBranches(function(err, branches) {
          branches.current.should.equal('master');
          branches.others.should.have.lengthOf(1);
          done();
        });
      });
    });

  });

  describe('.createBranchSync()', function() {

    it('should create a new branch', function(done) {
      repo2.createBranchSync('test');
      repo2.getBranchesSync().current.should.equal('master');
      repo2.getBranchesSync().others.should.have.lengthOf(1);
      done();
    });

  });

  describe('.checkout()', function() {

    it('should checkout a branch', function(done) {
      repo1.checkout('test', function(err) {
        should.not.exist(err);
        repo1.getBranches(function(err, branches) {
          should.not.exist(err);
          branches.current.should.equal('test');
          done();
        });
      });
    });

  });

  describe('.checkoutSync()', function() {

    it('should checkout a branch', function(done) {
      repo2.checkoutSync('test');
      repo2.getBranchesSync().current.should.equal('test');
      done();
    });

  });

  describe('.getBranches()', function() {

    it('should list all branches', function(done) {
      repo1.getBranches(function(err, branches) {
        should.not.exist(err);
        branches.current.should.equal('test');
        branches.others.should.have.lengthOf(1);
        branches.others[0].should.equal('master');
        done();
      });
    });

  });

  describe('.getBranchesSync()', function() {

    it('should list all branches', function(done) {
      repo2.getBranchesSync().current.should.equal('test');
      repo2.getBranchesSync().others.should.have.lengthOf(1);
      repo2.getBranchesSync().others[0].should.equal('master');
      done();
    });

  });

  describe('.merge()', function() {

    it('should merge a branch into the current branch', function(done) {
      repo1.add(['File1.txt'], function(err) {
        repo1.commit('add file', function(err) {
          repo1.checkout('master', function(err) {
            repo1.merge('test', function(err) {
              should.not.exist(err);
              repo1.log(function(err, log) {
                log.should.have.lengthOf(2);
                done();
              });
            });
          });
        });
      });
    });

  });

  describe('.mergeSync()', function() {

    it('should merge a branch into the current branch', function(done) {
      repo2.addSync(['File1.txt']);
      repo2.commitSync('add file');
      repo2.checkoutSync('master');
      repo2.mergeSync('test');
      repo2.logSync().should.have.lengthOf(2);
      done();
    });

  });

  describe('.createTag()', function() {

    it('should create a new tag', function(done) {
      repo1.createTag('test', function(err) {
        should.not.exist(err);
        repo1.getTags(function(err, tags) {
          tags.should.have.lengthOf(1);
          done();
        });
      });
    });

  });

  describe('.createTagSync()', function() {

    it('should create a new tag', function(done) {
      repo2.createTagSync('test');
      repo2.getTagsSync().should.have.lengthOf(1);
      done();
    });

  });

  describe('.getTags()', function() {

    it('should list all tags', function(done) {
      repo1.getTags(function(err, tags) {
        should.not.exist(err);
        tags.should.have.lengthOf(1);
        done();
      });
    });

  });

  describe('.getTagsSync()', function() {

    it('should list all tags', function(done) {
      repo2.getTagsSync().should.have.lengthOf(1);
      done();
    });

  });

  describe('.addRemote()', function() {

    it('should add a new remote', function(done) {
      repo1.addRemote('someremote', 'https://someremote', function(err) {
        should.not.exist(err);
        repo1.getRemotes(function(err, remotes) {
          should.exist(remotes.someremote);
          done();
        });
      });
    });

  });

  describe('.addRemoteSync()', function() {

    it('should add a new remote', function(done) {
      repo2.addRemoteSync('someremote', 'https://someremote');
      should.exist(repo2.getRemotesSync().someremote);
      done();
    });

  });

  describe('.getRemotes()', function() {

    it('should list all remotes', function(done) {
      repo1.getRemotes(function(err, remotes) {
        should.not.exist(err);
        Object.keys(remotes).should.have.lengthOf(1);
        done();
      });
    });

  });

  describe('.getRemotesSync()', function() {

    it('should list all remotes', function(done) {
      Object.keys(repo2.getRemotesSync()).should.have.lengthOf(1);
      done();
    });

  });

  describe('.setRemoteUrl()', function() {

    it('should change the remote url', function(done) {
      repo1.setRemoteUrl('someremote', 'https://anotherremote', function(err) {
        repo1.getRemotes(function(err, remotes) {
          remotes.someremote.should.equal('https://anotherremote');
          done();
        });
      });
    });

  });

  describe('.setRemoteUrlSync()', function() {

    it('should change the remote url', function(done) {
      repo2.setRemoteUrlSync('someremote', 'https://anotherremote');
      repo2.getRemotesSync().someremote.should.equal('https://anotherremote');
      done();
    });

  });

  describe('.removeRemote()', function() {

    it('should remove the remote', function(done) {
      repo1.removeRemote('someremote', function(err) {
        should.not.exist(err);
        repo1.getRemotes(function(err, remotes) {
          should.not.exist(remotes.someremote);
          done();
        });
      });
    });

  });

  describe('.removeRemoteSync()', function() {

    it('should remove the remote', function(done) {
      repo2.removeRemoteSync('someremote');
      should.not.exist(repo2.getRemotesSync().someremote);
      done();
    });

  });

  describe('.reset()', function() {

    it('should reset history to a past commit', function(done) {
      repo1.log(function(err, log) {
        repo1.reset(log[1].commit, function(err) {
          should.not.exist(err);
          repo1.log(function(err, log) {
            log.should.have.lengthOf(1);
            done();
          });
        });
      });
    });

  });

  describe('.resetSync()', function() {

    it('should reset history to a past commit', function(done) {
      repo2.resetSync(repo2.logSync()[1].commit);
      repo2.logSync().should.have.lengthOf(1);
      done();
    });

  });

  describe('.describe()', function() {

    it('should get the current commit hash', function(done) {
      repo1.describe(function(err, hash) {
        should.not.exist(err);
        repo1.log(function(err, log) {
          log[0].commit.substr(0, 7).should.equal(hash.substr(0, 7));
          done();
        });
      });
    });

  });

  describe('.describeSync()', function() {

    it('should get the current commit hash', function(done) {
      repo2.logSync()[0].commit.substr(0, 7).should.equal(
        repo2.describeSync().substr(0, 7)
      );
      done();
    });

  });

  describe('.cherryPick()', function() {

    it('should apply changes from another commit', function(done) {
      repo1.checkout('test', function(err) {
        fs.writeFile('cheRRy.txt', 'cherrypickme', function(err) {
          repo1.add(['cheRRy.txt'], function(err) {
            repo1.commit('cheRRypickme', function(err) {
              repo1.log(function(err, log) {
                repo1.checkout('master', function(err) {
                  repo1.cherryPick(log[0].commit, function(err) {
                    should.not.exist(err);
                    repo1.log(function(err, log) {
                      log.should.have.lengthOf(2);
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });

  });

  describe('.cherryPickSync()', function() {

    it('should apply changes from another commit', function(done) {
      repo2.checkoutSync('test');
      fs.writeFileSync('cheRRy.txt', 'cherrypickme');
      repo2.addSync(['cheRRy.txt']);
      repo2.commitSync('cherrypickme');
      var log = repo2.logSync();
      repo2.checkoutSync('master');
      repo2.cherryPickSync(log[0].commit);
      repo2.logSync().should.have.lengthOf(2);
      done();
    });

  });

  describe('.push()', function() {

    it('should push to the remote', function(done) {
      repo1.addRemoteSync('local', 'http://localhost:7001/target1');
      repo1.push('local', 'master', function(err, result) {
        should.not.exist(err);
        fs.existsSync(HOME + '/.gitty/target1.git').should.equal(true);
        done();
      });
    });

  });

  describe('.pull()', function() {

    it('should pull from the remote', function(done) {
      repo1.resetSync(repo1.logSync()[1].commit);
      repo1.logSync().should.have.lengthOf(1);
      repo1.pull('local', 'master', function(err, result) {
        should.not.exist(err);
        repo1.logSync().should.have.lengthOf(2);
        done();
      });
    });

  });

  describe('.show()', function() {

    it('should return a specific revision of a file from a commit ID', function(done) {
      fs.writeFile(repo1.path + '/Show.txt', 'showTest rev 1', function(err) {
        repo1.add([repo1.path + '/Show.txt'], function(err) {
          repo1.commit('showTest', function(err) {
            fs.writeFile(repo1.path + '/Show.txt', 'showTest rev 2', function(err) {
              repo1.add([repo1.path + '/Show.txt'], function(err) {
                repo1.commit('showTest change', function(err) {
                  repo1.log(function(err, log) {
                    repo1.show(log[1].commit, './Show.txt', function(err, data) {
                      data.should.equal('showTest rev 1');
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });

  });

  describe('.showSync()', function() {

    it('should return a specific revision of a file from a commit ID', function(done) {
      repo2.checkoutSync('test');

      fs.writeFileSync('Show.txt', 'showTest rev 1');
      repo2.addSync(['Show.txt']);
      repo2.commitSync('showTest');

      fs.writeFileSync('Show.txt', 'showTest rev 2');
      repo2.addSync(['Show.txt']);
      repo2.commitSync('showTest change');

      var log = repo2.logSync();
      var testText = repo2.showSync(log[1].commit, './Show.txt');

      testText.should.equal('showTest rev 1');
      done();
    });

  });

  describe('.stash()', function() {

    beforeEach(function() {
      fs.writeFileSync(repo1.path + '/File.txt', 'I am a file.');
    });

    it('should stash the new file and not show it in status', function(done) {
      repo1.stash([], function () {
        repo1.status(function(err, status) {
          should.not.exists(err);
          (status.untracked.indexOf('File.txt') === 0).should.equal(false);
          done();
        });
      });
    });
  });

  describe('.stashSync()', function() {

    beforeEach(function() {
      fs.writeFileSync(repo1.path + '/File.txt', 'I am a file.');
    });

    it('should stash the new file and not show it in status', function(done) {
      repo1.stashSync();
      repo1.status(function(err, status) {
        should.not.exists(err);
        (status.untracked.indexOf('File.txt') === 0).should.equal(false);
        done();
      });
    });
  });

  describe('support large buffers when using child processes', function() {

    var i;
    var NUM_FILES = 10000;
    repo3 = new Repository(HOME + '/.gitty/test3', {
      largeOperations: ['log', 'ls-files', 'status', 'commit'],
      largeOperationsMaxBuffer: 1024 * 5000
    });

    beforeEach(function() {
      var name;
      this.timeout(10000);
      for (i = 0; i < NUM_FILES; i++) {
        name = '/A_really_long_file_name_for_a_file_with_number-' + i + '.txt';
        fs.writeFileSync(repo3.path + name, 'I am file' + i + '!');
      }
    });

    it('should add, status, & commit a large number of files', function(done) {

      this.timeout(10000);

      repo3.init(function(err) {
        should.not.exists(err);

        repo3.status(function(err, status) {
          should.not.exists(err);
          status.untracked.length.should.equal(NUM_FILES);

          repo3.add([''], ['--all'], function(err) {
            should.not.exists(err);

            repo3.status(function(err, status2) {
              should.not.exists(err);
              status2.untracked.length.should.equal(0);
              status2.staged.length.should.equal(NUM_FILES);
              repo3.commit('Initial commit', function(err) {
                should.not.exists(err);
                repo3.status(function(err, status3) {
                  should.not.exists(err);
                  status3.untracked.length.should.equal(0);
                  status3.staged.length.should.equal(0);
                  done();
                })
              })
            })
          })
        })
      })
    })
  })
});
