# ep-deploy-s3

Scripts for deploying a project to `AWS S3`.

This library contains 2 scripts, `deploy` and `environments`. Use the deploy script to deploy a project to S3. Use the
environments script to inject environment variables into a config file. 

## Installation and overview

Simply add `ep-deploy-s3` as a dependency using `npm` or `yarn`:

    yarn add @weltn24/ep-deploy-s3

## Deploy Script

###Setup

To use the deploy script it's a best practice (although not necessary) to add a file called `ep-deployment.json` in
your root folder (next to your `package.json`). An example file would look like this (taken from the
_ep-cue-plugin-content-lock_ project):

```json
{
    "dev": {
        "dir": "./build",
        "bucket": "ep-cue-plugins-dev/ep-cue-plugin-content-lock"
    },
    "prod": {
        "dir": "./build",
        "bucket": "ep-cue-plugins-prod/ep-cue-plugin-content-lock"
    }
}
```

The root path contains 2 entries `dev` and `prod`. These are the 2 environments for which you can enter separate
S3 Buckets and / or directories. Each entry contains 2 fields `dir` and `bucket`. The _dir_ field specifies the 
local folder that should be uploaded to S3, the _bucket_ field contains the S3 bucket and (optionally) a subfolder
in the bucket to sync the local folder to. The bucket name and the folder are separated by a forward slash `/`.
E.g.:

A single name as _bucket_ will sync the local folder with that bucket:

```json
{
    "prod": {
        "dir": "./build",
        "bucket": "ep-cue-plugins-prod"
    }
}
```

This will remove all contents of the _ep-cue-plugins-prod_ bucket and upload the contents of the _build_ folder to it.
Since this is a potentially dangerous operation you will have to add `--sync-to-bucket-root` as a command line
argument if you do not specify a subfolder to sync the local folder. For more information read below.

Specify a subfolder to sync all contents of the local folder given as _dir_ to a subdirectory on S3:

```json
{
    "prod": {
        "dir": "./build",
        "bucket": "ep-cue-plugins-prod/ep-cue-plugin-content-lock"
    }
}
```

This will remove all contents _of the folder ep-cue-plugin-content-lock_ in the bucket _ep-cue-plugins-prod_ and upload
the contents of the local _build_ folder to it.

### Perform a sync

Once you have setup your syncing as stated above, add the following scripts in your `package.json`:

```json
{
    "deploy-dev": "ep-deploy-s3 deploy --stage dev",
    "deploy-prod": "ep-deploy-s3 deploy --stage prod"
}
```

Of course you can name your scripts the way you prefer it. Note that the scripts differ in their usage of the `--stage`
argument. _--stage dev_ will sync the folder to the S3 bucket as specified under `dev` in the `ep-deployment.json`, the
same goes for the `prod` stage.

Instead of using a config file, you can also specify the _dir_ and _bucket_ via command line arguments:

```json
{
    "deploy-dev": "ep-deploy-s3 deploy --dir ./build --bucket ep-cue-plugins-dev/ep-cue-plugin-content-lock"
}
```

Although this might make deployment harder to follow for other developers.

## Environment Script

### Setup

Create a file called `something.sample.js` in a folder of your choice. The filename can be anything you want but it must
end in `.sample.js`. TypeScript support (eg. a filename ending in `.sample.ts` will be implemented when we need it).
We usually create a file `environment.sample.js` in the folder `src/environments` (So the final path is 
`src/environments/environment.sample.js`).

In that file, all strings wrapped in angle brackets (< and >) will be replaced with environment variables of the same
name and saved to a new file with the same name of your _.sample.js_ file just without the string ".sample". E.g. if
you have a file _src/environments/something.sample.js_ that looks as follows:

```js
module.exports = {
    username: "<USERNAME>",
    password: "<PASSWORD>",
    databaseToken: "DATABASE_TOKEN"
};
```

and you run the environment script the strings `<USERNAME>`, `<PASSWORD>` and `<DATABASE_TOKEN>` will be replaced by
the environment variables of the names, `USERNAME`, `PASSWORD` and `DATABASE_TOKEN` (without brackets) from your system.
A new file will be created at _src/environments/something.js_ (because your filename was 
_src/environments/something.sample.js_) with the replaced variables.

## Important! .gitignore

You should check in the something.sample.js in your version control system but **you should always add your 
_something.js_ to your .gitignore**. The reasoning behind this is that you can check in a file with the structure of
your choice and make it available to other developers but you add your secrets locally or via the CI system.

### Perform env replacement

To replace your variables you call either of the following 2 options from your CLI or via npm scripts (the latter is 
preferred):

```
ep-deploy-s3 environments file src/environments/something.sample.js #or
ep-deploy-s3 environments dir src/environments
```

The first command will perform the replacement in a single file (the one you have specified). The second command will
search the given directory by all files ending in `*.sample.js` and perform the replacement on each file, generating
a new file for each file found.

### Missing environment vars

If you specify an environment variable that does not exists in the system, a warning will be printed and the replacement
will be cancelled. E.g. if you have the following file:

```js
module.exports = {
    username: "<USERNAME>",
    password: "<PASSWORD>",
    databaseToken: "DATABASE_TOKEN"
};
```

and any one of the variables `USERNAME`, `PASSWORD` and `DATABASE_TOKEN` is not set in the system's environment variables
the script will print a warning and stop. If you do not wish for this behaviour you can add the CLI option `--skip-unknown`
eg:

```
ep-deploy-s3 environments file src/environments/something.sample.js --skip-unknown
```

Missing variables will just remain untouched and the new file will be generated. A warning will still be printed.