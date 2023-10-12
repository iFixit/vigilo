import yargs from 'yargs'

const argv = yargs(process.argv.slice(2)).options(
    {
        auditName: {
            type: 'string',
            demandOption: true,
            description: 'Lighthouse audit name to update.',
        },
        auditType: {
            type: 'string',
            choices: ['score', 'value'],
            demandOption: true,
            description: 'Lighthouse audit type to update. Either "score" or "value"',
        },
        unit: {
            type: 'string',
            description: 'Datadog metric unit type for graph display.',
        },
        type: {
            type: 'string',
            choices: ['gauge', 'count', 'rate'],
            description: 'Datadog metric type',
        },
        description: {
            type:'string',
            description: 'Datadog metric description.'
        },
    })
    .strict()
    .parseSync();

const auditName =  argv.auditName
const auditType = argv.auditType as 'score' | 'value'
const metaData = {
    unit: argv.unit,
    type: argv.type as 'gauge' | 'count' | 'rate',
    description: argv.description
};