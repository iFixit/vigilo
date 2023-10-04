import Datadog from "./DatadogClient.js"
import dotenv from 'dotenv'
import { v1 } from '@datadog/datadog-api-client'
import fs from 'node:fs'

dotenv.config();

const inspectList = JSON.parse(fs.readFileSync('urls.json', 'utf8'));
const coreMetrics = JSON.parse(fs.readFileSync('metrics-config.json', 'utf8'));
const host = 'ubreakit.com';

// Auditname -> {warning: "warning value", alert: "alert value"}
const existingMarkers = {
    'largest-contentful-paint': {
        "warning": "2500 < y < 4000",
        "alert": "y > 4000",
    },
    'first-contentful-paint': {
        "warning": "1.8 < y < 3",
        "alert": "y > 3",
    },
    'cumulative-layout-shift': {
        "warning": "0.1 < y < 0.25",
        "alert": "y > 0.25",
    },
    'total-blocking-time': {
        "warning": "200 < y < 600",
        "alert": "y > 600",
    },
    'speed-index': {
        "warning": "3.4 < y < 5.8",
        "alert": "y > 5.8",
    },
};

function fetchAlertMarkersForAudit(auditName: string) {
    return existingMarkers.hasOwnProperty(auditName) ? [
        {
            "label": "Alert",
            "value": existingMarkers[auditName].alert,
            "display_type": "error dashed"
        },
        {
            "label": "Warning",
            "value": existingMarkers[auditName].warning,
            "display_type": "warning dashed"
        }
    ] : []
}

// replace all - with _ and lowercase the metricName for Datadog query
function formatMetricNameForDatadog(metricName: string): string {
    return metricName.replace(/-/g, '_').toLowerCase();
}

function createWidgetRequestsForMetric(audit: string, pageType: string) {
    return [
        {
            responseFormat: "timeseries",
            queries: [
                {
                    name: "query1",
                    dataSource: "metrics",
                    query: `avg:lighthouse.${formatMetricNameForDatadog(audit)}{host:${host},page_type:${formatMetricNameForDatadog(pageType)},$FormFactor} by {page_type,url,form_factor}`
                },
            ],
            formulas: [ {formula: "query1"} ],
            style: {
                palette: "dog_classic",
                lineType: "solid",
                lineWidth: "normal",
            },
            displayType: "line",
        },
    ]
}

function createWidget(title: string, type: string, requests: any[] = [], childWidgets: any[] = [], alertMarkers: any[] = []) {
    return {
        definition: {
            title: title,
            titleSize: "16",
            titleAlign: "left",
            showLegend: false,
            type: type,
            layoutType: "ordered",
            requests: requests,
            widgets: childWidgets,
            markers: alertMarkers,
        }
    }
}

function createWidgetsForAllPageTypes(audit: string) {
    const pageTypes = Object.keys(inspectList);
    const markers = fetchAlertMarkersForAudit(audit);
    const widgetDefinitions = pageTypes.map(pageType => {
        const requests = createWidgetRequestsForMetric(audit, pageType);
        return createWidget(pageType, 'timeseries', requests, [], markers)
    })

    return widgetDefinitions
}

// Capitalize and replace dashes with space for audit names
function formatAuditName(input: string): string {
    const words = input.split('-');
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
    return capitalizedWords.join(' ');
  }

function getWidgetForAllAudits(): v1.Widget[] {
    const audits = coreMetrics.audits;

    const widgetDefinitions: v1.Widget[] = audits.map(audit => {
        const title = formatAuditName(audit);
        const widgets = createWidgetsForAllPageTypes(audit);
        return createWidget(title, 'group', [], widgets)
    })

    return widgetDefinitions
}

function createDashboardsApiBody(): v1.DashboardsApiCreateDashboardRequest {
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
            widgets: getWidgetForAllAudits(),
        }
    }
}

(async() => {
    const dd = new Datadog({
        api_key: process.env.DD_API_KEY || '',
        app_key: process.env.DD_APP_KEY || ''
    })

    const params: v1.DashboardsApiCreateDashboardRequest = createDashboardsApiBody();
    await dd.createDashboard(params)
})()
