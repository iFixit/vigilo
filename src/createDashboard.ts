import Datadog from "./DatadogClient.js"
import dotenv from 'dotenv'
import { v1 } from '@datadog/datadog-api-client'
import fs from 'node:fs'

dotenv.config();

const inspectList = JSON.parse(fs.readFileSync('urls.json', 'utf8'));
const coreMetrics = JSON.parse(fs.readFileSync('metrics-config.json', 'utf8'));
const host = 'ubreakit.com';

function getDashboardsApiBody(): v1.DashboardsApiCreateDashboardRequest {
    return {
        body: {
            title: "Temporary Lighthouse Reports",
            templateVariables: [
                {
                  name: "FormFactor",
                  prefix: "form_factor",
                  availableValues: [],
                  _default: "*",
                },
            ],
            layoutType: "ordered",
            widgets: [],
        }
    }
}

(async() => {
    const dd = new Datadog({
        api_key: process.env.DD_API_KEY || '',
        app_key: process.env.DD_APP_KEY || ''
    })

    const params: v1.DashboardsApiCreateDashboardRequest = getDashboardsApiBody();
    await dd.createDashboard(params)
})()
