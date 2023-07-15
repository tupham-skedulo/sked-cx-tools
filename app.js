import { createTriggeredActionsHelper } from './handlers/triggered-actions.js';
import { createVfpFormsHelper } from './handlers/vfp-forms.js';
import { createWebhooksHelper } from './handlers/webhooks.js';
import { createCustomFieldsHelper } from './handlers/custom-fields.js';
import { createOrgPreferencesHelper } from './handlers/org-preferences.js';
import { createPackagesHelper } from './handlers/packages.js';
import fs from 'fs';
import path from 'path';

const App = (props) => {
    const { SKED_ACCESS_TOKEN, mode, componentsToDeploy, packageGit } = props;

    const readAccessToken = async () => {
        let rawdata = fs.readFileSync('./src/configurations/credentials.json');
        try {
            const credentials = JSON.parse(rawdata);
            return credentials.SKED_ACCESS_TOKEN;
        } catch (e) {
            return null;
        }
    }

    const readPackageConfig = () => {
        let rawdata = fs.readFileSync('./src/configurations/packages.json');
        try {
            const config = JSON.parse(rawdata);
            return {
                git: config.git,
                branch: config?.branch
            };
        } catch (e) {
            return null;
        }
    }

    const getHelper = async (componentToDeploy) => {
        const map = {
            1: createCustomFieldsHelper,
            2: createTriggeredActionsHelper,
            3: createWebhooksHelper,
            4: createVfpFormsHelper,
            5: createOrgPreferencesHelper,
            6: createPackagesHelper,
        };

        if(!map[componentToDeploy]) return null;
        return map[componentToDeploy]({
            SKED_ACCESS_TOKEN: SKED_ACCESS_TOKEN || await readAccessToken(),
            ...(componentToDeploy === 6 &&  {
                packageGit: packageGit || readPackageConfig().git,
                packageBranch: readPackageConfig().branch
            })
        })
    };

    const run = async (mode) => {
        console.log('Magic show begins ...');

        const logPath = path.join(process.env.PWD, 'src/configurations/logs');
        let helpers = [];
        for await (const componentToDeploy of componentsToDeploy) {
            helpers.push(await getHelper(componentToDeploy));
        }
        helpers = helpers.filter(item => item);

        const helperResult = {};
        for await (const helper of helpers) {
            const result = await (mode === 3 ? helper.backup() : helper.deploy());
            console.log('------------------------------------------------');
            helperResult[helper.getName()] = result;
        }

        if (!fs.existsSync(logPath)){
            fs.mkdirSync(logPath, { recursive: true });
        }

        await fs.writeFileSync(path.join(logPath, `${new Date()}.json`), JSON.stringify(helperResult));
    }

    return {
        run
    }
}

export const createApp = (props) => {
    return App(props);
}
