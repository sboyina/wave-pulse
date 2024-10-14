const { readFileSync, writeFileSync, copySync, readJSONSync } = require('fs-extra');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const execa = require('execa');

const execaOptions = {
    stdin: process.stdin,
    stdio: process.stdio,
    stdout: process.stdout,
    stderr: process.stderr
};

const projectDir = '.';

async function updatePackageVersion(packagePath, key, version) {
    let content = readFileSync(packagePath, 'utf8');
    content = content.replace(new RegExp(`"${key}"\\s*:\\s*"[^"]*"`), `"${key}": "${version}"`);
    writeFileSync(packagePath, content);
}

async function postBuild(runtimeVersion) {
    copySync(`${projectDir}/build/src`, `${projectDir}/dist/module`);
    copySync(`${projectDir}/package.json`, `${projectDir}/dist/module/package.json`);
    const packageData = readJSONSync(`${projectDir}/package.json`, {
        encoding: "utf8"
    });
    packageData.main = 'index';
    packageData.module = 'index';
    packageData.exports = {
      "./": "./"
    };
    packageData.scripts = {}; 
    writeFileSync(`${projectDir}/dist/module/package.json`, JSON.stringify(packageData, null, 2))
    await updatePackageVersion(`${projectDir}/dist/module/package.json`, 'version', runtimeVersion);
    console.log('Post Build successful!!!');
}


async function pushToLocalRepo() {
    writeFileSync(`${projectDir}/dist/new-build`, '' + Date.now);
    await execa('yalc', ['publish' , '--no-sig', '--push'], {
        'cwd': `${projectDir}/dist/module`
    });
    console.log('Published to yalc local repo!!!');
}

yargs(hideBin(process.argv)).command('post-build',
    'to run post processing after project build',
    (yargs) => {
        yargs.option('ver', {
            describe: 'version number',
            type: 'string',
            default: '1.0.0-dev-7'
        }).option('production', {
            describe: 'to perform a production build',
            type: 'boolean',
            default: false
        });
    }, (argv) => {
        postBuild(argv.ver).then(() => {
            if (argv.production) {
                return execa('npm', [
                    'publish', 
                    '--access=public',
                    '--tag=dev'
                ], {
                    ...execaOptions,
                    cwd: `${projectDir}/dist/module`
                });
            } else {
                return pushToLocalRepo();
            }
        });
    }).showHelpOnFail().argv;
