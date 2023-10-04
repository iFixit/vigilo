import Datadog from "./DatadogClient.js"
import dotenv from 'dotenv'
import { v1 } from '@datadog/datadog-api-client'
import fs from 'node:fs'

dotenv.config();

const inspectList = JSON.parse(fs.readFileSync('urls.json', 'utf8'));
const coreMetrics = JSON.parse(fs.readFileSync('metrics-config.json', 'utf8'));
const host = 'ubreakit.com';

function getWidget(title: string, type: string, requests: any[] = [], widgets: any[] = [], markers: any[] = []) {
    return {
        definition: {
            title: title,
            titleSize: "16",
            titleAlign: "left",
            showLegend: false,
            type: type,
            layoutType: "ordered",
            requests: requests,
            widgets: widgets,
            markers: markers,
        }
    }
}

function getWidgetForAllPageTypes(audit: string) {
    const pageTypes = Object.keys(inspectList);

    const widgetDefinitions = pageTypes.map(pageType => {
        const requests = [];
        return getWidget(pageType, 'timeseries', requests)
    })

    return widgetDefinitions
}

// Capitalize and replace dashes with space for audit names
function replaceAndCapitalize(input: string): string {
    const words = input.split('-');
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
    return capitalizedWords.join(' ');
  }

function getWidgetForAllAudits(): v1.Widget[] {
    const audits = coreMetrics.audits;

    const widgetDefinitions: v1.Widget[] = audits.map(audit => {
        const title = replaceAndCapitalize(audit);
        const widgets = getWidgetForAllPageTypes(audit);
        return getWidget(title, 'group', [], widgets)
    })

    return widgetDefinitions
}


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
            widgets: getWidgetForAllAudits() as v1.Widget[],
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
