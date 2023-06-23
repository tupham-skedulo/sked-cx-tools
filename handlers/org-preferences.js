import axios from "axios";
import _ from 'lodash';
import fs from 'fs';

const OrgPreferencesHelper = (props) => {
    const { SKED_ACCESS_TOKEN } = props;

    const readConfigurations = async () => {
        let rawdata = fs.readFileSync('./src/configurations/org-preferences.json');
        try {
            return JSON.parse(rawdata);
        } catch (e) {
            return [];
        }
    }

    const saveConfigurations = (data) => {
        try {
            fs.writeFileSync(
                `./src/backup/org-preferences-${new Date().getTime()}.json`,
                JSON.stringify(data, null, '\t')
            );

            console.log('>>>> Current org preferences saved');
        } catch (e) {
            console.log(e)
        }
    }

    const backup = async (data) => {
        console.log('>>>> Saving current org preferences');

        if (!data) {
            const currentOrgPreferences = await getList();
            saveConfigurations(currentOrgPreferences);

            return;
        }

        saveConfigurations(data);
    }

    const getList = async () => {
        const res = await axios.get('https://api.skedulo.com/config/org_preference', {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })

        return res?.data?.result || [];
    }

    const createOrgPreferences = async (item) => {
        const res = await axios.post(`https://api.skedulo.com/config/org_preference`, item, {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })

        return res;
    }

    const deploy = async () => {
        const currentOrgPreferences = await getList();
        await backup(currentOrgPreferences);

        const preferencesToDeploy = await readConfigurations();

        console.log('>>>> Deploying org preferences');

        const result = {
            input: preferencesToDeploy,
            success: null,
            error: null
        }
        try {
            const res = await createOrgPreferences(preferencesToDeploy);
            result.success = res.data;
        } catch (e) {
            result.error = e;
        }

        console.log('>>>> Finished deploying preferences');

        return result;
    }

    return {
        getName: () => 'Org Preferences',
        deploy,
        backup,
    }
}

export const createOrgPreferencesHelper = (props) => {
    return OrgPreferencesHelper(props)
} 
