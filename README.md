# grunt-lock-extended

> A Grunt-Plugin to handle lockfiles within Grunt, currently just wraps lockSync of https://www.npmjs.org/package/lockfile

## Getting Started
This plugin requires Grunt `~0.4.2`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-lock-extended --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-lock-extended');
```

## Origin
This modul was forked from https://github.com/evangelion1204/grunt-lock. 
I had some issues with handling lockfile with multi-thread processes.

If you are looking for a simple and easy to use lockfile-wrapper, i recommend grunt-lock.


## The "lockfile" task
```js
lockfile: {
    your_target: {
        path: 'yourname.lck',
        //you can add one task to be ignored by the lockfile task. - i use it for an unlock task with email-reporting
        ignored: [
          'taskToIgnore1',
          'taskToIgnore2'
        ],
        //only allowed tasks can create a lockfile - other tasks will fail fatal
        allowed: [
          'taskToAllow1',
          'taskToAllow2'
        ], 
        //if true, just the fails and warnings are logged
        quiet: true|false
    }
}
```

### Options

#### path [required]
The path where your lockfile will be created

#### ignored [optional]
a string or an array of tasknames that will be ignored creating a lockfile

#### allowed [optional]
a string or an array of tasknames.
Only there tasks will be able to run, if this option is set

#### quiet [optional - default=false]
STFU for this module. Just log what is really necessary!

## Autostart the lock
To ensure the lockfile-task is invoked everytime you use grunt, you should add the following code right after grunt.initConfig()
```js
grunt.task.run('lockfile');
```

## The "lockfile" format
```js
{
  "user": "currentUser",
  "pid": 12345,
  "tasks": ["theExecutedTask"],
  "created": "<creation time of lockfile in SQL-Format>"
}
```

### Overview
This Module is supposed to be used on multiuser-systems.
The generated lockfile will contain information about the invoking task.
The Task adds the option "parentPid" with the current pid to the grunt-options. That allows us to start 
childprocesses, in which the current lockfile will not prevent execution.

To allow a childprocess the execucting user and the given parentPid have to match the ones in lockfile.

In your project's Gruntfile, add a section named `lockfile` to the data object passed into `grunt.initConfig()`.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).


This plugin was inspired by https://github.com/evangelion1204/grunt-lock
