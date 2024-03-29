import axios from 'axios';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';

const CustomFieldsHelper = (props) => {
    const { SKED_ACCESS_TOKEN } = props;

    const readConfigurations = async () => {
        try {
            const rawdata = fs.readFileSync(path.resolve(process.cwd(), 'src/configurations/custom-fields.json'));

            const customFieldsData = JSON.parse(rawdata);

            const customFieldsValues = Object.values(customFieldsData);

            const schemasData = customFieldsValues.map(item => ({
                id: item.id,
                label: item.label,
                mapping: item.mapping,
                name: item.name
            }));

            const fieldsData = customFieldsValues.reduce((accumulative, currentValue) => {
                accumulative = [...accumulative, ...currentValue.fields]

                return accumulative;
            }, []);

            return {
                schemasData,
                fieldsData,
            }
        } catch (e) {
            console.log(e)
            return {
                schemasData: [],
                fieldsData: [],
            }
        }
    }

    const saveConfigurations = (data) => {
        try {
            fs.writeFileSync(
                `./src/backup/custom-fields-${new Date().getTime()}.json`,
                JSON.stringify(data, null, '\t')
            );

            console.log('>>>> Current custom fields saved');
        } catch (e) {
            console.log(e)
        }
    }

    const backup = async (data) => {
        console.log('>>>> Saving current custom fields');

        if (!data) {
            const currentSchemas = await getSchemasList();
            const currentFields = await getFieldsList();
            const dataToSave = transformData(currentSchemas, currentFields);

            saveConfigurations(dataToSave);

            return;
        }

        saveConfigurations(data);
    }

    const transformData = (schemas, fields) => {
        if (!schemas.length || !fields.length) {
            return {}
        }

        return schemas.reduce((accumulative, currentSchemas) => {
            const mappedFields = _.sortBy(fields.filter((field) => field.schemaName === currentSchemas.name), "displayOrder");

            if (mappedFields.length > 0) {
                accumulative[currentSchemas.name] = { ...currentSchemas, fields: mappedFields };
            }

            return accumulative;
        }, {});
    }

    const getSchemasList = async () => {
        const customSchemasResponse = await axios.get('https://api.skedulo.com/custom/schemas', {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })

        const standardSchemasResponse = await axios.get('https://api.skedulo.com/custom/standard_schemas', {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })

        const customSchemas = (customSchemasResponse?.data?.result ?? []).map((schemas) => ({ ...schemas, isStandard: false }))
        const standardSchemas = (standardSchemasResponse?.data?.result ?? []).map((schemas) => ({ ...schemas, isStandard: true }))

        return [...customSchemas, ...standardSchemas];
    }

    const getFieldsList = async () => {
        const res = await axios.get('https://api.skedulo.com/custom/fields', {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        })

        return res?.data?.result || [];
    }

    const deleteSchemas = async (item) => {
        if (!item.id) return;
        return await axios.delete(`https://api.skedulo.com/custom/schema/${item.id}`, {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        });
    }

    const deleteField = async (item) => {
        if (!item.id) return;
        return await axios.delete(`https://api.skedulo.com/custom/field/${item.id}`, {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        });
    }

    const createSchemas = async (items) => {
        return await axios.post(`https://api.skedulo.com/custom/schemas`, items, {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        });
    }

    const createFields = async (items) => {
        return await axios.post(`https://api.skedulo.com/custom/fields`, items, {
            headers: {
                'Authorization': `Bearer ${SKED_ACCESS_TOKEN}`
            }
        });
    }

    const deploy = async () => {
        const currentSchemas = await getSchemasList();
        const currentFields = await getFieldsList();
        const { schemasData, fieldsData } = await readConfigurations();

        console.log('>>>> Saving current custom fields');
        const dataToSave = transformData(currentSchemas, currentFields);
        await backup(dataToSave);

        const currentCustomSchemas  = currentSchemas.filter((schemas) => !schemas.isStandard);

        const result = {
            input: {
                schemas: schemasData,
                fields: fieldsData,
            },
            success: {
                schemas: null,
                fields: null,
            },
            error: null
        };

        console.log('>>>> Deploying custom fields');

        console.log('>>>> Purging fields', currentFields.length);
        await Promise.all(currentFields.map(async (field) => {
            await deleteField(field);
        })).catch((e) => {
            console.log(e)
        });

        console.log('>>>> Purging schemas', currentCustomSchemas.length);
        await Promise.all(currentCustomSchemas.map(async (schemas) => {
            await deleteSchemas(schemas);
        })).catch((e) => {
            console.log(e)
        });

        const postSchemas = schemasData.filter(item => item.id);
        const postFields = fieldsData.map(item => _.omit(item, ['id']));

        try {
            console.log('>>>> Create schemas ', postSchemas.length);
            const schemaRes = await createSchemas(postSchemas);

            console.log('>>>> Create fields ', postFields.length);
            const fieldRes =  await createFields(postFields);

            result.success.schemas = schemaRes.data;
            result.success.fields = fieldRes.data;
        } catch (e) {
            console.log(e)
            result.error = e;
        }

        console.log('>>>> Finished deploying custom fields');

        return result;
    }

    return {
        deploy,
        getName: () => 'Custom fields',
        backup,
    }
}

export const createCustomFieldsHelper = (props) => {
    return CustomFieldsHelper(props)
}
