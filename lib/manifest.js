var fs = require("fs"),
  path = require('path'),
  util = require('util');
var brocWriter = require("broccoli-writer");
var helpers = require("broccoli-kitchen-sink-helpers");

var BroccoliManifest = function BroccoliManifest(inTree, options) {
  if (!(this instanceof BroccoliManifest)) {
    return new BroccoliManifest(inTree, options);
  }
  this.inTree = inTree;
  options = options || {};
  this.appcacheFile = options.appcacheFile || "/manifest.appcache";
  this.excludePattern = options.excludePattern || [];
  this.includePattern = options.includePattern || [];
  this.additionalLines = options.additionalLines || [];
};

BroccoliManifest.prototype = Object.create(brocWriter.prototype);
BroccoliManifest.prototype.constructor = BroccoliManifest;

BroccoliManifest.prototype.write = function(readTree, destDir) {
  var appcacheFile = this.appcacheFile,
    excludePattern = this.excludePattern,
    includePattern = this.includePattern,
    additionalLines = this.additionalLines;
  return readTree(this.inTree).then(function(srcDir) {
    var lines = ["CACHE MANIFEST", "# created " + (new Date()).toISOString(), "", "CACHE:"];

    getFilesRecursively(srcDir, ["**/*"]).forEach(function(file) {
      var srcFile = path.join(srcDir, file);
      var stat = fs.lstatSync(srcFile);
      if(includePattern){
        if (!(matchReg(file, includePattern)) ||(matchReg(file, excludePattern)) || stat.isDirectory() || (!stat.isFile() && !stat.isSymbolicLink())) {
          return;
        }
        lines.push(file);
      }else{
        if ((matchReg(file, excludePattern)) || stat.isDirectory() || (!stat.isFile() && !stat.isSymbolicLink())) {
          return;
        }
        lines.push(file);
      }
      
    });

    lines.push.apply(lines,additionalLines);

    lines.push("", "NETWORK:", "*");

    fs.writeFileSync(path.join(destDir, appcacheFile), lines.join("\n"));
  });
};

/**
 * Match One the Regex expression
 * @param path
 * @param regs
 * @returns {boolean}
 */
function matchReg(path, regs) {
  if (!Array.isArray(regs) || typeof path !== "string") {
    return false;
  } else {
    for (var i = 0, l = regs.length; i < l; i++) {
      test = path.match(regs[i]);
      if(test && test.length){
        return true;
      }
    }
    return false;
  }
}

function getFilesRecursively(dir, globPatterns) {
  return helpers.multiGlob(globPatterns, {cwd: dir});
}



module.exports = BroccoliManifest;
