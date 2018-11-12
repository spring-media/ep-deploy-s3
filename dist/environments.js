(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("ep-deploy-s3", [], factory);
	else if(typeof exports === 'object')
		exports["ep-deploy-s3"] = factory();
	else
		root["ep-deploy-s3"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 7);
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
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const fs = __webpack_require__(0);
const glob = __webpack_require__(8)({ gitignore: true });
const chalk = __webpack_require__(2);
const argv = __webpack_require__(3).argv;
const path = __webpack_require__(1);

/* ****************************************
 *
 * Script start
 *
 **************************************** */

if (argv.dir) {
  console.log(chalk.dim('\nProcessing files in ' + path.resolve(argv.dir) + '\n'));
  const files = glob.readdirSync(argv.dir + '/*.sample.js');
  files.forEach(replaceEnvVars);
  console.log(chalk.green('Finished successfully') + '\n');
}

if (argv.file) {
  if (!/.sample.js$/.test(argv.file)) {
    console.log(chalk.red('Error:') + ' File must end with .sample.js');
    process.exit(1);
  }
  console.log(chalk.dim('\nProcessing file in ' + path.resolve(argv.file) + '\n'));
  replaceEnvVars(argv.file);
  console.log(chalk.green('Finished successfully') + '\n');
}

/* ****************************************
 *
 * Helper functions
 *
 **************************************** */

function replaceEnvVars(inputFile) {
  const outputFile = inputFile.replace(/.sample.js$/, '.js');
  const inputContents = fs.readFileSync(inputFile, 'utf8');

  console.log('📄  ' + path.basename(inputFile) + ' -> ' + path.basename(outputFile));

  const outputContents = inputContents.replace(/<\s*(\S+?)\s*>/g, function (match, envVarName) {
    const envVar = process.env[envVarName];
    if (envVar === undefined && argv['skip-unknown']) {
      console.log('   ' + chalk.red('x') + chalk.dim(' Skipping ' + envVarName + ' (not defined in process.env)'));
      return match;
    } else if (envVar === undefined) {
      console.log('   ' + chalk.red('x') + ' ' + envVarName + ' not defined in process.env\n');
      process.exit(1);
    } else {
      console.log('   ' + chalk.green('✓') + chalk.dim(' Replacing ' + envVarName));
    }

    return envVar;
  });

  fs.writeFileSync(outputFile, outputContents);

  console.log('');
}

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("glob-fs");

/***/ })
/******/ ]);
});