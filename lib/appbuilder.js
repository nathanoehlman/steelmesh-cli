var events = require('events'),
    util = require('util'),
    async = require('async'),
    path = require('path'),
    fs = require('fs');

function AppBuilder() {
    
}

util.inherits(AppBuilder, events.EventEmitter);

AppBuilder.prototype._findVersion = function(targetFolder, callback) {
    // if we have package data, then use that version
    
    // otherwise, look for an app.js file
    try {
        var appData = require(path.join(targetFolder, 'app.js'));
        
        this.version = '1.0.0';
    }
    catch (e) {
        this.version = '2.0.0';
    }
    
    callback();
};

AppBuilder.prototype._loadPackageData = function(targetFolder, callback) {
    // load the package.json file from the specified directory
    fs.readFile(path.join(targetFolder, 'package.json'), 'utf8', function(err, data) {
        console.log(data);
        
        callback();
    });
};

AppBuilder.prototype.exec = function(cleaver, action, args, callback) {
    var handler = this.handler(action);
    if (typeof handler == 'function') {
        handler.apply(this, cleaver, args);
        
        this.on('done', function() {
            if (callback) {
                callback();
            }
            else {
                cleaver.exec('quit');
            }
        });
    }
    else {
        out('!{red}No handler for action: {0}', action);
        cleaver.exec('quit');
    }
};

AppBuilder.prototype.handler = function(action) {
    var handler;
    
    try {
        // first attempt to get the handler for the current version
        handler = require('./handler/' + action + '-' + this.version + '.js'); 
    }
    catch (e) {
        // couldn't find a version specific handler, let's try the default handler
        handler = require('./handler/' + action + '.js');
    }
    
    return handler;
};

AppBuilder.prototype.init = function(targetFolder, callback) {
    var builder = this;
    
    if (typeof targetFolder == 'function' && arguments.length === 1) {
        callback = targetFolder;
        targetFolder = process.cwd();
    }
    
    async.series([
        this._loadPackageData.bind(this, targetFolder),
        this._findVersion.bind(this, targetFolder)
    ], function(err) {
        console.log(builder.version);
    });
};

exports = module.exports = AppBuilder;

exports.create = function() {
    return new AppBuilder();
};