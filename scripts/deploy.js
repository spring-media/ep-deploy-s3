const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const s3 = require('s3');
const async = require('async');
const chalk = require('chalk');
const argv = require('yargs').argv;


/* ****************************************
 *
 * Config
 *
 **************************************** */

const configFile = path.resolve('./ep-deployment.json');
const config = getConfig(configFile);


/* ****************************************
 *
 * Script start
 *
 **************************************** */

console.log('\nLoading config');

if (fs.existsSync(configFile)) {
    console.log(' ' + chalk.green('✓') + chalk.dim(' Found config file in ' + configFile));
}

if (argv.dir || argv.bucket) {
    console.log(' ' + chalk.green('✓') + chalk.dim(' Got command line arguments for dir/bucket'));
}

console.log('\nUsing config');
console.log(' ' + chalk.green('✓') + chalk.dim(' Local Dir: ' + config.localDir));
console.log(' ' + chalk.green('✓') + chalk.dim(' Bucket Name: ' + config.bucket));
console.log(' ' + chalk.green('✓') + chalk.dim(' Bucket Dir: ' + (config.remoteDir || '/')));

console.log('\nSyncing local dir to s3');
Promise.resolve()
    .then(function () {
        return sync(config.localDir, config.bucket, config.remoteDir)
    })
    .then(function () {
        console.log('\n' + chalk.green('Finished successfully') + '\n');
        process.exit(0);
    });


/* ****************************************
 *
 * Helper functions
 *
 **************************************** */

/**
 * Returns the merged configs from the file and the argv arguments
 * @param {string} configFile Path to the config file
 * @returns {{localDir: string, bucket: string, remoteDir: string}}
 */
function getConfig(configFile) {
    const config = Object.assign({}, readConfigFromJson(configFile), readConfigFromArgv());
    if (!config.dir) {
        exitWithError('No directory specified');
    }
    if (!config.bucket) {
        exitWithError('No bucket specified');
    }
    const bucketAndPath = config.bucket.split('/');
    const bucket = bucketAndPath.shift();
    const remoteDir = bucketAndPath.join('/');
    return {
        localDir: path.resolve(config.dir),
        bucket: bucket,
        remoteDir: remoteDir,
    }
}

/**
 * Returns the config from the config file
 * @returns {{dir: string, bucket: string}|{}}
 */
function readConfigFromJson(configFile) {
    if (!argv.stage) {
        exitWithError('No stage specified, please call ep-deploy-s3 with --stage dev or --stage prod');
    }
    try {
        return require(configFile)[argv.stage];
    } catch (e) {
        return {};
    }
}

/**
 * Returns the config from the argv arguments
 * @returns {{dir: string, bucket: string}}
 */
function readConfigFromArgv() {
    const config = {};
    if (argv.dir) config.dir = argv.dir;
    if (argv.bucket) config.bucket = argv.bucket;
    return config;
}

function exitWithError(message) {
    console.log(chalk.red('\nerror') + ' ' + message + '\n');
    process.exit(1);
}

/**
 * Syncs a folder with an s3 bucket
 * @param {string} localDir The local dir to sync
 * @param {string} bucket The bucket name to sync to
 * @param {string} remoteDir The path in the bucket to sync to
 */
function sync(localDir, bucket, remoteDir) {
    const files = fs.readdirSync(localDir);
    return Promise.resolve()
        .then(function () {
            return removeFromS3(files, bucket, remoteDir);
        })
        .then(function () {
            return uploadToS3(localDir, bucket, remoteDir)
        })
}

/**
 * Syncs a folder with an s3 bucket
 * @param {[string]} files The local dir to sync
 * @param {string} bucket The bucket name to sync to
 * @param {string} remoteDir The path in the bucket to sync to
 * @returns {Promise}
 */
function removeFromS3(files, bucket, remoteDir) {
    return new Promise(function (resolve, reject) {
        console.log('\nDeleting remote directory ' + bucket + '/' + remoteDir);
        remoteDir = remoteDir || '';

        const awsS3Client = new AWS.S3({
            region: 'eu-central-1',
            signatureVersion: 'v4'
        });

        const client = s3.createClient({
            s3Client: awsS3Client
        });

        const deleter = client.deleteDir({
            Bucket: bucket,
            Prefix: remoteDir
        });

        deleter.on('error', function(err) {
            console.error('\n' + chalk.red('error'), 'unable to sync:', err.message + '\n');
            reject(err);
        });

        deleter.on('progress', function() {
            process.stdout.write('.');
        });

        deleter.on('end', function() {
            console.log('\n' + chalk.green('Done!'));
            resolve();
        });
    });
}

/**
 * Syncs a folder with an s3 bucket
 * @param {string} localDir The local dir to sync
 * @param {string} bucket The bucket name to sync to
 * @param {string} remoteDir The path in the bucket to sync to
 * @returns {Promise}
 */
function uploadToS3(localDir, bucket, remoteDir) {
    return new Promise(function (resolve, reject) {
        console.log('\nUploading local director to ' + bucket + '/' + remoteDir);
        remoteDir = remoteDir || '';

        const awsS3Client = new AWS.S3({
            region: 'eu-central-1',
            signatureVersion: 'v4'
        });

        const client = s3.createClient({
            s3Client: awsS3Client
        });

        const uploader = client.uploadDir({
            deleteRemoved: true,
            localDir: localDir,
            s3Params: {
                Bucket: bucket,
                Prefix: remoteDir,
            },
        });

        uploader.on('error', function(err) {
            console.error('\n' + chalk.red('error'), 'unable to sync:', err.message + '\n');
            reject(err);
        });

        uploader.on('progress', function() {
            process.stdout.write('.');
        });

        uploader.on('end', function() {
            console.log('\n' + chalk.green('Done!'));
            resolve();
        });
    });
}
