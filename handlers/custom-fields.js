const fs = require('fs');

let accessToken = process.argv?.[2];
let jsonFile = process.argv?.[3];

console.log('args', process.argv)
console.log('token', accessToken)
console.log('json', jsonFile)

try {
    if (!accessToken) {
        accessToken = fs.readFileSync('./assets/credentials.txt', 'utf8');
    }

    const data = fs.readFileSync(jsonFile ? jsonFile : './assets/custom-fields.json', 'utf8');
    const customFieldsData = JSON.parse(data);

    const customFieldsValues = Object.values(customFieldsData);

    const schemasData = customFieldsValues.map(item => ({
        id: item.id,
        label: item.label,
        mapping: item.mapping,
        name: item.name
    }));

    const fieldsData = customFieldsValues.reduce((accumulative, currentValue) => {
        accumulative = [...accumulative, currentValue.fields]

        return accumulative;
    }, []);

    console.log('schema', schemasData)
    // console.log('fields', fieldsData)
} catch (error) {
    console.log(error)
}