(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("ep-deploy-s3", [], factory);
	else if(typeof exports === 'object')
		exports["ep-deploy-s3"] = factory();
	else
		root["ep-deploy-s3"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("chalk");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("yargs");

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Syncs a folder with an s3 bucket
 * @param {string} localDir The local dir to sync
 * @param {string} bucket The bucket name to sync to
 * @param {string} remoteDir The path in the bucket to sync to
 */
let sync = (() => {
  var _ref = _asyncToGenerator(function* (localDir, bucket, remoteDir) {
    yield removeFromS3(bucket, remoteDir);
    yield uploadToS3(localDir, bucket, remoteDir);
  });

  return function sync(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
})();

/**
 * Removes files from a bucket
 * @param {string} bucket The bucket name to sync to
 * @param {string} remoteDir The path in the bucket to sync to
 * @returns {Promise}
 */


let removeFromS3 = (() => {
  var _ref2 = _asyncToGenerator(function* (bucket, remoteDir) {
    console.log('\nDeleting remote directory ' + bucket + '/' + remoteDir);

    const awsS3Client = new _awsSdk2.default.S3({
      region: 'eu-central-1',
      signatureVersion: 'v4'
    });

    const items = remoteDir ? [{ Key: remoteDir }] : (yield awsS3Client.listObjects({ Bucket: bucket }).promise()).Contents;
    const deleteParamsForItems = items.map(function (item) {
      return { Bucket: bucket, Key: item.Key };
    });

    try {
      for (const itemDeleteParams of deleteParamsForItems) {
        yield awsS3Client.deleteObject(itemDeleteParams).promise();
        process.stdout.write('.');
      }
    } catch (err) {
      throw new Error('Unable remove files:', err.message + '\n');
    }
  });

  return function removeFromS3(_x4, _x5) {
    return _ref2.apply(this, arguments);
  };
})();

/**
 * Syncs a folder with an s3 bucket
 * @param {string} localDir The local dir to sync
 * @param {string} bucket The bucket name to sync to
 * @param {string} remoteDir The path in the bucket to sync to
 * @returns {Promise}
 */


let uploadToS3 = (() => {
  var _ref3 = _asyncToGenerator(function* (localDir, bucket, remoteDir = '') {
    console.log('\nUploading local directory to ' + bucket + '/' + remoteDir);

    const awsS3Client = new _awsSdk2.default.S3({
      region: 'eu-central-1',
      signatureVersion: 'v4'
    });

    try {
      yield copyFolderContentsToBucket(awsS3Client, bucket, remoteDir, localDir);
      console.log('\n' + _chalk2.default.green('Done!'));
    } catch (err) {
      throw new Error('Unable upload files:', err.message + '\n');
    }
  });

  return function uploadToS3(_x6, _x7) {
    return _ref3.apply(this, arguments);
  };
})();

/**
 * Recursively copies the contents of a local folder to a bucket on S3
 * @param {S3} awsS3Client An instance of an S3 client
 * @param {string} bucket The name of the bucket to copy to
 * @param {string} prefix A path to a folder in the bucket
 * @param {string} rootFolder the local folder to copy
 * @param {string} [subFolder] Used for recursion. Do not use it yourself
 * @returns {Promise.<void>}
 */


let copyFolderContentsToBucket = (() => {
  var _ref4 = _asyncToGenerator(function* (awsS3Client, bucket, prefix, rootFolder, subFolder = '') {
    const fileNames = _fs2.default.readdirSync(_path2.default.join(rootFolder, subFolder));

    for (const fileName of fileNames) {
      const pathToFileInSubFolder = _path2.default.join(subFolder, fileName);
      const pathToFileInRootFolder = _path2.default.join(rootFolder, subFolder, fileName);
      const fileIsDirectory = _fs2.default.lstatSync(pathToFileInRootFolder).isDirectory();

      if (fileIsDirectory) {
        yield copyFolderContentsToBucket(awsS3Client, bucket, prefix, rootFolder, pathToFileInSubFolder);
      } else {
        const Bucket = bucket;
        const Key = prefix ? `${prefix}/${pathToFileInSubFolder}` : pathToFileInSubFolder;
        const Body = _fs2.default.readFileSync(pathToFileInRootFolder);
        yield awsS3Client.putObject(Object.assign(config.putParams, { Bucket, Key, Body })).promise();
        process.stdout.write('.');
      }
    }
  });

  return function copyFolderContentsToBucket(_x8, _x9, _x10, _x11) {
    return _ref4.apply(this, arguments);
  };
})();

var _fs = __webpack_require__(0);

var _fs2 = _interopRequireDefault(_fs);

var _path = __webpack_require__(1);

var _path2 = _interopRequireDefault(_path);

var _awsSdk = __webpack_require__(5);

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _chalk = __webpack_require__(2);

var _chalk2 = _interopRequireDefault(_chalk);

var _yargs = __webpack_require__(3);

var _jsonfile = __webpack_require__(6);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/* ****************************************
 *
 * Config
 *
 **************************************** */

console.log(`\n${_chalk2.default.blue('info')} Loading config`);

let config;

try {
  config = getConfig();
} catch (err) {
  console.log(`\n${_chalk2.default.red('error')} Failed to load config. Got error: ${err.message}`);
  process.exit(1);
}

/* ****************************************
 *
 * Script start
 *
 **************************************** */

console.log(`\n${_chalk2.default.blue('info')} Using config`);
console.log(' ' + _chalk2.default.green('✓') + _chalk2.default.dim(' Local Dir: ' + config.localDir));
console.log(' ' + _chalk2.default.green('✓') + _chalk2.default.dim(' Bucket Name: ' + config.bucket));
console.log(' ' + _chalk2.default.green('✓') + _chalk2.default.dim(' Bucket Dir: ' + (config.remoteDir || '/')));

console.log('\nSyncing local dir to s3');

sync(config.localDir, config.bucket, config.remoteDir).then(() => {
  console.log('\n' + _chalk2.default.green('Sync finished successfully') + '\n');
  process.exit(0);
}).catch(err => {
  console.log(`\n${_chalk2.default.red('error')} Failed to sync. Got error: ${err.message}`);
  process.exit(1);
});

/* ****************************************
 *
 * Helper functions
 *
 **************************************** */

/**
 * Returns the merged configs from the file and the argv arguments
 * @returns {{localDir: string, bucket: string, remoteDir: string}}
 */
function getConfig() {
  const configFile = _path2.default.resolve('./ep-deployment.json');
  const configFileExists = _fs2.default.existsSync(configFile);

  if (configFileExists && !_yargs.argv.stage) {
    throw new Error('Config file exists but no stage has been set via cli argument. Please specify --stage');
  } else if (configFileExists) {
    console.log(' ' + _chalk2.default.green('✓') + _chalk2.default.dim(' Found config file in ' + configFile));
  } else {
    console.log(_chalk2.default.blue('info') + _chalk2.default.dim(' No config file found expecting command line arguments'));
  }

  if (_yargs.argv.dir || _yargs.argv.bucket) {
    console.log(' ' + _chalk2.default.green('✓') + _chalk2.default.dim(' Got command line arguments for dir/bucket'));
  }

  const config = Object.assign({}, readConfigFromJson(configFile), readConfigFromArgv());

  if (!config.dir) {
    throw new Error('No directory specified');
  }

  if (!config.bucket) {
    throw new Error('No bucket specified');
  }

  if (typeof config.putParams !== 'object') {
    config.putParams = {};
  }

  const bucketAndPath = config.bucket.split('/');
  const bucket = bucketAndPath.shift();
  const remoteDir = bucketAndPath.join('/');

  if (remoteDir === '' && !_yargs.argv['sync-to-bucket-root']) {
    throw new Error('You are trying to sync to the bucket root (not in a subfolder of the bucket).\n' + 'Please add --sync-to-bucket-root to signal you are absolutely sure you are willing to do this.\n' + 'Warning: All contents of the bucket will be deleted and synced with your local folder');
  }

  return {
    localDir: _path2.default.resolve(config.dir),
    bucket: bucket,
    remoteDir: remoteDir
  };
}

/**
 * Returns the config from the config file
 * @returns {{dir: string, bucket: string}|{}}
 */
function readConfigFromJson(configFile) {
  if (!_yargs.argv.stage) {
    throw new Error('No stage specified, please call ep-deploy-s3 with --stage dev or --stage prod');
  }
  try {
    return (0, _jsonfile.readFileSync)(configFile)[_yargs.argv.stage];
  } catch (e) {
    console.log(`${_chalk2.default.blue('info')} no config file found`);
    return {};
  }
}

/**
 * Returns the config from the argv arguments
 * @returns {{dir: string, bucket: string}}
 */
function readConfigFromArgv() {
  const config = {};
  if (_yargs.argv.dir) config.dir = _yargs.argv.dir;
  if (_yargs.argv.putParams) config.putParams = JSON.parse(_yargs.argv.putParams);
  if (_yargs.argv.bucket) config.bucket = _yargs.argv.bucket;
  return config;
}

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("aws-sdk");

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("jsonfile");

/***/ })
/******/ ]);
});