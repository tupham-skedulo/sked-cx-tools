import { createTriggeredActionsHelper } from "./handlers/triggered-actions.js";
import { createVfpFormsHelper } from "./handlers/vfp-forms.js";
import { createWebhooksHelper } from "./handlers/webhooks.js";
import { createCustomFieldsHelper } from './handlers/custom-fields.js';
import { createOrgPreferencesHelper } from './handlers/org-preferences.js';
import fs from "fs";

const App = (props) => {
    const { SKED_ACCESS_TOKEN, mode, componentsToDeploy } = props;

    const readAccessToken = async () => {
        let rawdata = fs.readFileSync('./src/configurations/credentials.json');
        try {
            const credentials = JSON.parse(rawdata);
            return credentials.SKED_ACCESS_TOKEN;
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
        };

        if(!map[componentToDeploy]) return null;
        return map[componentToDeploy]({
            SKED_ACCESS_TOKEN: SKED_ACCESS_TOKEN || await readAccessToken()
        })
    };

    const run = async (mode) => {
        console.log('Magic show begins ...');

        let helpers = [];
        for await (const componentToDeploy of componentsToDeploy) {
            helpers.push(await getHelper(componentToDeploy));
        };
        helpers = helpers.filter(item => item);

        const helperResult = {};
        for await (const helper of helpers) {
            const result = await (mode === 3 ? helper.backup() : helper.deploy());
            console.log('------------------------------------------------');
            helperResult[helper.getName()] = result;
        }

        await fs.writeFileSync(`./src/configurations/logs/${new Date()}.json`, JSON.stringify(helperResult));
    }

    return {
        run
    }
}

export const createApp = (props) => {
    return App(props);
}