import { createTriggeredActionsHelper } from "./handlers/triggered-actions.js";
import { createVfpFormsHelper } from "./handlers/vfp-forms.js";
import { createWebhooksHelper } from "./handlers/webhooks.js";
import fs from "fs";

const App = (props) => {
    const { SKED_ACCESS_TOKEN, mode, componentsToDeploy } = props;

    const getHelper = (componentToDeploy) => {
        const map = {
            1: null,
            2: createTriggeredActionsHelper,
            3: createWebhooksHelper,
            4: createVfpFormsHelper
        };

        if(!map[componentToDeploy]) return null;
        return map[componentToDeploy]({
            SKED_ACCESS_TOKEN
        })
    };

    const run = async () => {
        console.log('Magic show begins ...');

        const helpers = componentsToDeploy.map(componentToDeploy => {
            return getHelper(componentToDeploy);
        }).filter(item => item);

        const helperResult = {};
        for await (const helper of helpers) {
            const result = await helper.deploy();
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