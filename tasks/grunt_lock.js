/*
 * grunt-lock
 * https://github.com/evangelion1204/grunt-lock
 *
 * Copyright (c) 2014 Michael Geppert
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    var lockFile = require('lockfile'),
        readline = require('readline');


    grunt.registerMultiTask('lockfile', 'Wraps nodejs lockfile with some additional features', function() {
        var done = this.async(),
            rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            }),
            data = this.data,
            options = data.options || {},
            interactive = data.interactive || false,

            handleWait = function() {
                rl.question("Lockfile already established, try again? [y/N] ", function(answer) {
                    answer = answer || 'N';

                    if (answer.toLowerCase() == 'y') {
                        setTimeout(doLock, 0);
                    }
                    else {
                        rl.close();
                    }
                });
            },
            doLock = function () {
                try {
                    // lets try to establish a synced lock
                    lockFile.lockSync(data.path, options);
                }
                catch (er) {
                    // check the error code
                    if (er.code == 'EEXIST') {
                        // the file is already present
                        if (!interactive) {
                            grunt.fail.warn('Could not establish lockfile ' + data.path);
                            done();
                            return ;
                        }

                        // user wants interactive mode, ask for waiting
                        handleWait();
                        return ;
                    }
                    else {
                        // an unhandled exception occured, something like an invalid option for the current mode
                        grunt.fail.warn('Unhandled Exception: ' + er);
                        done();
                        return ;
                    }
                }

                grunt.log.ok('Lockfile established');
                done();
            };

        if (!data.path) {
            grunt.fail.warn('Missing filename for lockfile');
        }

        grunt.verbose.writeln('Lockfile: ' + data.path);

        doLock();
    });
};