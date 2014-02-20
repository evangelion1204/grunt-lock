/*
 * grunt-lock
 * https://github.com/evangelion1204/grunt-lock
 *
 * Copyright (c) 2014 Michael Geppert
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    var lockFile = require('lockfile')

    grunt.registerMultiTask('lockfile', 'Wraps nodejs lockfile with some additional features', function() {
        var data = this.data;

        if (!data.path) {
            grunt.fail.warn('Missing filename for lockfile');
        }

        grunt.verbose.write('Lockfile: ' + data.path);

        var locked = lockFile.checkSync(data.path, function(er) {
            grunt.fail.warn('An error occured checking lockfile' + er);
        });

        if (locked) {
            grunt.fail.warn('Could not establish lockfile ' + data.path);
        }

        lockFile.lockSync(data.path, {}, function(er) {
            grunt.fail.warn('An error occured writing lockfile' + er);
        });
    });
};