import { createTriggeredActionsHelper } from "./handlers/triggered-actions.js";
import { createVfpFormsHelper } from "./handlers/vfp-forms.js";
import { createWebhooksHelper } from "./handlers/webhooks.js";

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
        })

        for await (const helper of helpers) {
            await helper?.deploy();
            helper && console.log('------------------------------------------------');
        }
    }

    return {
        run
    }
}

export const createApp = (props) => {
    return App(props);
}