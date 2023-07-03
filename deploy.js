import inquirer from 'inquirer';
import { createApp } from './app.js';

async function main() {
    const { mode } = await inquirer.prompt([{
        type: 'list',
        name: 'mode',
        message: 'Choose deploy mode:',
        default: 0,
        choices: [{
            value: 0,
            name: 'Deploy from git to org'
        }, {
            value: 1,
            name: 'Deploy from git to multiple org'
        }, {
            value: 2,
            name: 'Deploy from org to org'
        }, {
            value: 3,
            name: 'Backup current configs'
        }]
    }]);

    if (mode === 1 || mode === 2) {
        console.log('This mode is not supported yet');
        return;
    }

    const { componentsToDeploy } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'componentsToDeploy',
        message: 'Which configurations need to be deployed/backup:',
        default: [1, 2, 3, 4, 5, 6],
        choices: [{
            value: 1,
            name: 'Customfields'
        }, {
            value: 2,
            name: 'Triggered Actions'
        }, {
            value: 3,
            name: 'Webhooks'
        }, {
            value: 4,
            name: 'Visualforce Page Forms'
        }, {
            value: 5,
            name: 'Org Preferences'
        }, {
            value: 6,
            name: 'Packages'
        }]
    }]);

    const { accessToken } = await inquirer.prompt([{
        type: 'input',
        name: 'accessToken',
        message: 'Input Skedulo access token (Default access token will be get from configurations/credentials.json):',
        default: ''
    }]);

    let appConfig = {
        mode,
        componentsToDeploy,
        SKED_ACCESS_TOKEN: accessToken,
    };

    if (componentsToDeploy.includes(6)) {
        const { packagePath } = await inquirer.prompt([{
            type: 'input',
            name: 'packagePath',
            message: 'Input package folder name (Package folder should be located in src/packages):',
            default: ''
        }]);

        appConfig = { ...appConfig, packagePath };
    }

    const app = createApp(appConfig);

    await app.run(mode);
}

await main();
