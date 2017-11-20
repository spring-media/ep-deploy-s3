import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import chalk from 'chalk';
import { argv } from 'yargs';

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

sync(config.localDir, config.bucket, config.remoteDir)
        .then(() => {
            console.log('\n' + chalk.green('Sync finished successfully') + '\n');
            process.exit(0);
        })
        .catch(err => {
            console.log(`\n${chalk.red('error')} Failed to sync. Got error: ${err.message}`);
            process.exit(1);
        });

/* ****************************************
 *
 * Helper functions
 *
 **************************************** */

/**
 * Quits the node app and prints an error message
 * Used for config methods that are not part of the sync promise
 * @param message
 */
function exitWithError(message) {
    console.log(`\n${chalk.red('error')} ${message}`);
    process.exit(1);
}

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

/**
 * Syncs a folder with an s3 bucket
 * @param {string} localDir The local dir to sync
 * @param {string} bucket The bucket name to sync to
 * @param {string} remoteDir The path in the bucket to sync to
 */
async function sync(localDir, bucket, remoteDir) {
    await removeFromS3(bucket, remoteDir);
    await uploadToS3(localDir, bucket, remoteDir);
}

/**
 * Removes files from a bucket
 * @param {string} bucket The bucket name to sync to
 * @param {string} remoteDir The path in the bucket to sync to
 * @returns {Promise}
 */
async function removeFromS3(bucket, remoteDir) {

    console.log('\nDeleting remote directory ' + bucket + '/' + remoteDir);

    const awsS3Client = new AWS.S3({
        region: 'eu-central-1',
        signatureVersion: 'v4'
    });

    const items = remoteDir ? [{Key: remoteDir}] : (await awsS3Client.listObjects({ Bucket: bucket }).promise()).Contents;
    const deleteParamsForItems = items.map(item => ({Bucket: bucket, Key: item.Key}));

    try {
        for (const itemDeleteParams of deleteParamsForItems) {
            await awsS3Client.deleteObject(itemDeleteParams).promise();
            process.stdout.write('.');
        }
    } catch (err) {
        throw new Error('Unable remove files:', err.message + '\n');
    }

}

/**
 * Syncs a folder with an s3 bucket
 * @param {string} localDir The local dir to sync
 * @param {string} bucket The bucket name to sync to
 * @param {string} remoteDir The path in the bucket to sync to
 * @returns {Promise}
 */
async function uploadToS3(localDir, bucket, remoteDir = '') {

    console.log('\nUploading local directory to ' + bucket + '/' + remoteDir);

    const awsS3Client = new AWS.S3({
        region: 'eu-central-1',
        signatureVersion: 'v4'
    });

    try {
        await copyFolderContentsToBucket(awsS3Client, bucket, remoteDir, localDir);
        console.log('\n' + chalk.green('Done!'));
    } catch (err) {
        throw new Error('Unable upload files:', err.message + '\n');
    }
}

/**
 * Recursively copies the contents of a local folder to a bucket on S3
 * @param {S3} awsS3Client An instance of an S3 client
 * @param {string} bucket The name of the bucket to copy to
 * @param {string} prefix A path to a folder in the bucket
 * @param {string} rootFolder the local folder to copy
 * @param {string} [subFolder] Used for recursion. Do not use it yourself
 * @returns {Promise.<void>}
 */
async function copyFolderContentsToBucket(awsS3Client, bucket, prefix, rootFolder, subFolder = '') {

    const fileNames = fs.readdirSync(path.join(rootFolder, subFolder));

    for (const fileName of fileNames) {

        const pathToFileInSubFolder = path.join(subFolder, fileName);
        const pathToFileInRootFolder = path.join(rootFolder, subFolder, fileName);
        const fileIsDirectory = fs.lstatSync(pathToFileInRootFolder).isDirectory();

        if (fileIsDirectory) {
            await copyFolderContentsToBucket(awsS3Client, bucket, rootFolder, pathToFileInSubFolder)
        } else {
            const Bucket = bucket;
            const Key = prefix ? `${prefix}/${pathToFileInSubFolder}` : pathToFileInSubFolder;
            const Body = fs.readFileSync(pathToFileInRootFolder);
            await awsS3Client.putObject({ Bucket, Key, Body }).promise()
            process.stdout.write('.');
        }
    }
}
