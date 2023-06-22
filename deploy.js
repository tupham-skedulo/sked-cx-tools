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
    
    if(mode === 1 || mode === 2) {
        console.log('This mode is not supported yet');
        return;
    }

    const { componentsToDeploy } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'componentsToDeploy',
        message: 'Which configurations need to be deployed/backup:',
        default: [1, 2, 3, 4, 5],
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
        }]
    }]);

    const { accessToken } = await inquirer.prompt([{
        type: 'input',
        name: 'accessToken',
        message: 'Input Skedulo access token (Default access token will be get from configurations/credentials.json):',
        default: ''
    }]);

    const app = createApp({
        mode,
        componentsToDeploy,
        SKED_ACCESS_TOKEN: accessToken
    });

    await app.run(mode);
}

await main();