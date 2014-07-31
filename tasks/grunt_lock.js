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
    fs = require('fs'),
    minimatch = require('minimatch'),
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
        //if the task would be locked, check if the current task is allowed
        if (!checkForAllowedTask(data.allowed, grunt.cli.tasks)) {
          grunt.fail.fatal('Task not allowed');
        }

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
          grunt.fail.warn(getLockInfo() + data.path);
          return;
        } else {
          // an unhandled exception occured, something like an invalid option for the current mode
          grunt.fail.warn('Unhandled Exception: ' + ex);
          return;
        }
      }

      grunt.log.ok('Lockfile established');
    },
    /**
     * TODO: Unittest
     * @param {String} string
     * @param {String} pattern
     * @returns {*|exports}
     */
    matches = function (string, pattern) {
      return minimatch(string, pattern);
    },
    /**
     * Check if the ignore array covers all (manual) executed tasks
     * TODO: add a unit test for this
     * @param {String|Array} ignore
     * @param {Array} tasks
     * @returns {boolean}
     */
    checkForIgnoredTask = function (ignore, tasks) {
      if (!ignore) {
        return false;
      }

      //if ignore is just a string, wrap it in a array
      if (!Array.isArray(ignore) && String.isString(ignore)) {
        ignore = [ignore];
      }

      var taskIterator = tasks.values();
      var task;

      while (!(task = taskIterator.next()).done) {
        var taskIsIgnored = false;
        var ignorePatternIterator = ignore.values();
        var ignorePattern;
        while (!(ignorePattern = ignorePatternIterator.next()).done) {
          if (matches(task, ignorePattern)) {
            taskIsIgnored = true;
            break;
          }
        }

        if (!taskIsIgnored) {
          return false;
        }
      }

      return false;
    },
    /**
     * TODO: unittest
     * TODO: function merge with checkForIgnoredTask
     *
     * @param allowed
     * @param tasks
     * @returns {boolean}
     */
    checkForAllowedTask = function (allowed, tasks) {
      if (!allowed) {
        return true;
      }

      //if ignore is just a string, wrap it in a array
      if (!Array.isArray(allowed) && String.isString(allowed)) {
        allowed = [allowed];
      }

      var taskIterator = tasks.values();
      var task;

      while (!(task = taskIterator.next()).done) {
        var taskIsAllowed = false;

        var allowPatternIterator = allowed.values();
        var allowPattern;
        while (!(allowPattern = allowPatternIterator.next()).done) {
          if (matches(task, allowPattern)) {
            taskIsAllowed = true;
            break;
          }
        }

        if (!taskIsAllowed) {
          return false;
        }
      }

      return false;
    };

  grunt.registerMultiTask('lockfile', 'Wraps nodejs lockfile with some additional features, currently only lockSync.', function () {
    var done = this.async(),
      data = this.data,
      options = data.options || {};

    if (!data.path) {
      grunt.fail.warn('Missing filename for lockfile');
    }

    grunt.verbose.writeln('Lockfile: ' + data.path);

    if (checkForIgnoredTask(data.ignore, grunt.cli.tasks)) {
      grunt.log.ok('Detected ignored task for logfile. Lockchecks disabled. Lockfile will not be created.');
      done();
    } else {
      handleLockfile(data, options, done);
    }
  });
};