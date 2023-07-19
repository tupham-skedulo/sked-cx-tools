import axios from "axios";
import _ from 'lodash';
import fs from 'fs';

const VfpFormsHelper = (props) => {
    const { SKED_ACCESS_TOKEN } = props;

    const readConfigurations = async () => {
        let rawdata = fs.readFileSync('./src/configurations/vfp-forms.json');
        try {
            return JSON.parse(rawdata);
        } catch (e) {
            return {};
        }
    }

    const get = async () => {
        const res = await axios.get('https://api.skedulo.com/config/org_preference', {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })
    
        return res?.data?.result?.visualforce || {};
    }

    const saveConfigurations = (data) => {
        try {
            fs.writeFileSync(
                `./src/backup/vfp-forms-${new Date().getTime()}.json`,
                JSON.stringify(data, null, '\t')
            );

            console.log('>>>> Current vfp forms saved');
        } catch (e) {
            console.log(e)
        }
    }

    const backup = async (data) => {
        console.log('>>>> Saving vfp forms');

        if (!data) {
            const currentVfpForms = await get();
            saveConfigurations(currentVfpForms);

            return;
        }

        saveConfigurations(data);
    }

    const save = async (item) => {
        const res = await axios.post(`https://api.skedulo.com/config/org_preference`, item, {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })

        return res;
    }

    const deploy = async () => {
        const currentVfpForms = await get();
        await backup(currentVfpForms);

        const vfpForms = await readConfigurations();
        console.log('>>>> Deploying visualpage forms');
        
        const result = {
            input: vfpForms,
            success: null,
            error: null
        };

        try {
            const res = await save({
                visualforce: vfpForms
            });

            result.success = res.data;
        } catch (e) {
            result.error = e;
        }

        console.log('>>>> Finished deploying visualpage forms');
        return result;
    }

    return {
        getName: () => 'Visualforce page forms',
        deploy,
        backup
    }
}

export const createVfpFormsHelper = (props) => {
    return VfpFormsHelper(props)
} 
