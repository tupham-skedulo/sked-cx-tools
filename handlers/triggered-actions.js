import axios from "axios";
import _ from 'lodash';
import fs from 'fs';

const TriggeredActionsHelper = (props) => {
    const { SKED_ACCESS_TOKEN } = props;

    const readConfigurations = async () => {
        let rawdata = fs.readFileSync('./src/configurations/triggered_actions.json');
        try {
            return JSON.parse(rawdata);
        } catch (e) {
            return [];
        }
    }

    const getList = async () => {
        const res = await axios.get('https://api.skedulo.com/triggered_actions', {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })
    
        return res?.data?.result || [];
    }

    const saveConfigurations = (data) => {
        try {
            fs.writeFileSync(
                `./src/backup/trigger-actions-${new Date().getTime()}.json`,
                JSON.stringify(data, null, '\t')
            );

            console.log('>>>> Current trigger actions saved');
        } catch (e) {
            console.log(e)
        }
    }

    const backup = async (data) => {
        console.log('>>>> Saving current trigger actions');

        if (!data) {
            const currentTriggerActions = await getList();
            saveConfigurations(currentTriggerActions);

            return;
        }

        saveConfigurations(data);
    }


    const deleteTriggeredAction = async (item) => {
        if(!item.id) return;
        const res = await axios.delete(`https://api.skedulo.com/triggered_actions/${item.id}`, {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })

        return res;
    }
    
    const createTriggeredAction = async (item) => {
        const res = await axios.post(`https://api.skedulo.com/triggered_actions`, item, {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })

        return res;
    }

    const deploy = async () => {
        const currentTriggeredActions = await getList();
        await backup(currentTriggeredActions);

        const triggeredActionsToDeploy = await readConfigurations();
        console.log('>>>> Deploying triggered actions');
        
        const result = {};

        for await (const triggeredAction of triggeredActionsToDeploy) {
            console.log('>>>>>>>> Deploying triggered action:', triggeredAction.name);

            result[triggeredAction.name] = {
                input: triggeredAction,
                success: null,
                error: null
            }
            try {
                const currentTriggeredAction = currentTriggeredActions.find(item => triggeredAction.name === item.name);
                if(currentTriggeredAction) {
                    await deleteTriggeredAction(currentTriggeredAction);
                }
                const res = await createTriggeredAction(_.omit(triggeredAction, ['id']));
                result[triggeredAction.name].success = res.data;
            } catch (e) {
                result[triggeredAction.name].error = e;
            }
        }

        console.log('>>>> Finished deploying triggered actions');

        return result;
    }

    return {
        getName: () => 'Triggered actions',
        deploy,
        backup
    }
}

export const createTriggeredActionsHelper = (props) => {
    return TriggeredActionsHelper(props)
} 
