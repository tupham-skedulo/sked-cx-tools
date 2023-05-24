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
            return [];
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

    const save = async (item) => {
        const res = await axios.post(`https://api.skedulo.com/config/org_preference`, item, {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })

        return res;
    }

    const deploy = async () => {
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
        deploy
    }
}

export const createVfpFormsHelper = (props) => {
    return VfpFormsHelper(props)
} 
