/*
 * grunt-lock-extended
 * https://github.com/lxlang/grunt-lock-extended
 * 
 * forked from: https://github.com/evangelion1204/grunt-lock
 *
 * Original work Copyright (c) 2014 Michael Geppert
 * Modified work Copyright (c) 2014 Tobias Lang
 * 
 * Licensed under the MIT license.
 */
'use strict';

module.exports = function (grunt) {

  var lockFile = require('lockfile'),
    readline = require('readline'),
    fs = require('fs'),
    handleWait = function () {
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question("Lockfile already established, try again? [y/N] ", function (answer) {
        answer = answer || 'N';

        rl.close();

        if (answer.toLowerCase() == 'y') {
          setTimeout(handleLockfile, 0);
        }
      });
    },
    getLockInfo = function (lockInfo) {
      return "Grunt is locked by user ".yellow + lockInfo.user.red.bold + " with command ".yellow + "grunt ".red.bold + lockInfo.tasks.join(" ").red.bold + " started at ".yellow + lockInfo.created.red.bold;
    },
    writeLockInfo = function (data) {
      try {
        var fd = fs.openSync(data.path, 'w');
        fs.writeSync(fd, JSON.stringify({
          user: process.env['USER'],
          pid: process.pid,
          tasks: grunt.cli.tasks, //TODO: check
          created: grunt.template.today('yyyy-mm-dd HH:MM:ss')
        }));
      } catch (ex) {
        //TODO: delete lockfile before fail
        grunt.fail.warn('Could not write info to lockfile');
      }
    },
    handleLockfile = function (data, options, done) {
      var createLockFile = true;

      try {
        grunt.verbose.ok('try writing lockinfo to file');
        var lockInfo = grunt.file.readJSON(data.path);
        if (lockInfo) {
          var parentPid = lockInfo.pid,
            givenParentPid = grunt.option('parentPid');

          //create lock can be skipped, if this process is a child-process of the locking one
          if (lockInfo.user == process.env['USER'] && parentPid == givenParentPid) {
            grunt.log.ok('lockfile exists, but is from a parentProcess');
            createLockFile = false;
          } else {
            grunt.fail.fatal(getLockInfo(lockInfo));
          }
        }
      } catch (ex) {
        //erors here are ok. we can not read the lockfile if it does not exists 
      }

      if (createLockFile) {
        grunt.verbose.ok('Creating Lockfile');
        //Create lock at every run!
        createLock(data, options, done);
        
        //add current pid to options, so that we can check if tasks are childtasks
        if (!grunt.option('parentPid')) {
          grunt.option('parentPid', grunt.config.get('pid'));
        }
      }
      done();
    },
    createLock = function (data, options) {
      try {
        // lets try to establish a synced lock
        lockFile.lockSync(data.path, options);
        writeLockInfo(data);

        grunt.log.ok(JSON.stringify(grunt.file.readJSON(data.path)));
      } catch (ex) {
        // check the error code
        if (ex.code == 'EEXIST') {
          // the file is already present

          if (!data.interactive) {
            grunt.fail.warn(getLockInfo() + data.path);
            return;
          }

          // user wants interactive mode, ask for waiting
          handleWait();
          return;
        } else {
          // an unhandled exception occured, something like an invalid option for the current mode
          grunt.fail.warn('Unhandled Exception: ' + ex);
          return;
        }
      }

      grunt.log.ok('Lockfile established');
    };

  grunt.registerMultiTask('lockfile', 'Wraps nodejs lockfile with some additional features, currently only lockSync.', function () {
    var done = this.async(),
      data = this.data,
      options = data.options || {};

      

    if (!data.path) {
      grunt.fail.warn('Missing filename for lockfile');
    }

    grunt.verbose.writeln('Lockfile: ' + data.path);
    
    if (grunt.cli.tasks[0] == data.ignore) {
      grunt.log.ok('Detected ignored task for logfile. Lockchecks disabled. Lockfile will not be created.');
    } else {
      handleLockfile(data, options, done);
    }
  });
};