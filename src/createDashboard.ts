import Datadog from "./DatadogClient.js"
import dotenv from 'dotenv'
import { v1 } from '@datadog/datadog-api-client'
import fs from 'node:fs'

dotenv.config();

const inspectList = JSON.parse(fs.readFileSync('urls.json', 'utf8'));
const coreMetrics = JSON.parse(fs.readFileSync('metrics-config.json', 'utf8'));
const host = 'ubreakit.com';

(async() => {
    const dd = new Datadog({
        api_key: process.env.DD_API_KEY || '',
        app_key: process.env.DD_APP_KEY || ''
    })

    const params: v1.DashboardsApiCreateDashboardRequest = {};
    await dd.createDashboard(params)
})()
