import yargs from 'yargs'
import { v1 } from '@datadog/datadog-api-client';
import Datadog from "./DatadogClient.js"
import dotenv from 'dotenv'

dotenv.config();

async function updateDatadogMetric(auditName: string, auditType: 'score' | 'value',  metaData: v1.MetricMetadata) {
    const dd = new Datadog({
        api_key: process.env.DD_API_KEY || '',
        app_key: process.env.DD_APP_KEY || ''
    })

    const metricName = `lighthouse.${auditName}.${auditType}`;
    await dd.updateMetricMetadata(metricName, metaData);
}

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

await updateDatadogMetric(auditName, auditType, metaData);
