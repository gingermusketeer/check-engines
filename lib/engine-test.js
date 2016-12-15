var childProcess = require('child_process');
var format = require('util').format;
var semver = require('semver');

var ENGINE_TEST_ARGS = {
  yarn: '--version'
};

function EngineTest(type) {
  this.type = type;
  this.isNode = type === 'node' || type === 'iojs';
}

EngineTest.prototype.check = function(range, callback) {
  var type = this.type;

  this.getVersion(function(err, version) {
    var msg;
    if (err) {
      msg = format(
        'Unable to determine version for (%s). Error was (%s)',
        type,
        err.message
      );
      return callback(new Error(msg));
    }

    if (!semver.satisfies(version, range)) {
      msg = format(
        '%s version (%s) does not satisfy specified range (%s)',
        type,
        version,
        range
      );

      return callback(new Error(msg), [type, version, range]);
    }

    callback(null, [type, version, range]);
  });
};

EngineTest.prototype.getVersion = function(callback) {
  if (this.isNode) {
    process.nextTick(function() {
      callback(null, process.version.substring(1));
    });

    return;
  }
  var versionExec = childProcess.spawn(
    this.type, [ENGINE_TEST_ARGS[this.type] || '-v']
  );
  var result = '';
  versionExec.stdout.on('data', function(data) {
    result += data.toString();
  });
  versionExec.on('close', function() {
    callback(null, result.trim());
  });
  versionExec.on('error', callback);
};

module.exports = EngineTest;
