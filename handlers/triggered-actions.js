import axios from "axios";
import _ from 'lodash';
import fs from 'fs';

const TriggeredActionsHelper = (props) => {
    const { SKED_ACCESS_TOKEN } = props;

    const readConfigurations = async () => {
        let rawdata = fs.readFileSync('./src/configurations/triggered_actions.json');
        return JSON.parse(rawdata);
    }

    const getList = async () => {
        const res = await axios.get('https://api.skedulo.com/triggered_actions', {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })
    
        return res?.data?.result || [];
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
        deploy
    }
}

export const createTriggeredActionsHelper = (props) => {
    return TriggeredActionsHelper(props)
} 
