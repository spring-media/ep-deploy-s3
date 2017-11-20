const fs = require('fs');
const glob = require('glob-fs')({ gitignore: true });
const chalk = require('chalk');
const argv = require('yargs').argv;
const path = require('path');

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
