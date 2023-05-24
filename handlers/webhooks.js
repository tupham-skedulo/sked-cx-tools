import axios from "axios";
import _ from 'lodash';
import fs from 'fs';

const WebhooksHelper = (props) => {
    const { SKED_ACCESS_TOKEN } = props;

    const readConfigurations = async () => {
        let rawdata = fs.readFileSync('./src/configurations/webhooks.json');
        try {
            return JSON.parse(rawdata);
        } catch (e) {
            return [];
        }
    }

    const getList = async () => {
        const res = await axios.get('https://api.skedulo.com/webhooks', {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })
    
        return res?.data?.result || [];
    }

    const deleteWebhook = async (item) => {
        if(!item.id) return;
        const res = await axios.delete(`https://api.skedulo.com/webhooks/${item.id}`, {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })

        return res;
    }
    
    const createWebhook = async (item) => {
        const res = await axios.post(`https://api.skedulo.com/webhooks`, item, {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })

        return res;
    }

    const deploy = async () => {
        const currentwebhooks = await getList();
        const webhooksToDeploy = await readConfigurations();
        console.log('>>>> Deploying webhooks');
        
        const result = {};

        for await (const webhook of webhooksToDeploy) {
            console.log('>>>>>>>> Deploying webhook:', webhook.name);

            result[webhook.name] = {
                input: webhook,
                success: null,
                error: null
            }
            try {
                const currentwebhook = currentwebhooks.find(item => webhook.name === item.name);
                if(currentwebhook) {
                    await deleteWebhook(webhook);
                }
                const res = await createWebhook(_.omit(webhook, ['id']));
                result[webhook.name].success = res.data;
            } catch (e) {
                result[webhook.name].error = e;
            }
        }

        console.log('>>>> Finished deploying webhooks');

        return result;
    }

    return {
        getName: () => 'Webhooks',
        deploy
    }
}

export const createWebhooksHelper = (props) => {
    return WebhooksHelper(props)
} 
