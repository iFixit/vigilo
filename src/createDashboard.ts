import Datadog from "./DatadogClient.js"
import dotenv from 'dotenv'
import { v1 } from '@datadog/datadog-api-client'
import { readJsonFile, formatAuditName, formatMetricNameForDatadog } from './utils.js'

dotenv.config();

type WidgetDefinition = {
    title: string,
    titleSize: string,
    titleAlign: string,
    showLegend: boolean,
    type: string,
    layoutType: string,
    requests: any[],
    widgets: any[],
    markers: any[]
}

const defaultWidgetDefinition: WidgetDefinition = {
    title: "",
    titleSize: "16",
    titleAlign: "left",
    showLegend: true,
    type: "timeseries",
    layoutType: "ordered",
    requests: [],
    widgets: [],
    markers: []
}

const URLS_FILE_PATH = 'urls.json';
const METRICS_CONFIG_PATH = 'metrics-config.json';
const HOST = 'ubreakit.com';
const INSPECT_LIST = readJsonFile(URLS_FILE_PATH);
const CORE_METRICS = readJsonFile(METRICS_CONFIG_PATH);

// Auditname -> {warning: "warning value", alert: "alert value"}
const ALERT_MARKERS = {
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
    return ALERT_MARKERS.hasOwnProperty(auditName) ? [
        {
            "label": "Alert",
            "value": ALERT_MARKERS[auditName].alert,
            "display_type": "error dashed"
        },
        {
            "label": "Warning",
            "value": ALERT_MARKERS[auditName].warning,
            "display_type": "warning dashed"
        }
    ] : []
}

function createWidgetRequestsForMetric(audit: string, pageType: string) {
    return [
        {
            responseFormat: "timeseries",
            queries: [
                {
                    name: "query1",
                    dataSource: "metrics",
                    query: `avg:lighthouse.${formatMetricNameForDatadog(audit)}{host:${HOST},page_type:${formatMetricNameForDatadog(pageType)},$FormFactor} by {page_type,url,form_factor}`
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

function createWidget(widget: Partial<WidgetDefinition>) {
    return {
        definition: {...defaultWidgetDefinition, ...widget}
    }
}

function createWidgetsForAllPageTypes(audit: string) {
    const pageTypes = Object.keys(INSPECT_LIST);
    const alertMarkers = fetchAlertMarkersForAudit(audit);
    const widgetDefinitions = pageTypes.map(pageType => {
        const requests = createWidgetRequestsForMetric(audit, pageType);
        return createWidget({title: pageType, requests: requests, markers: alertMarkers})
    })

    return widgetDefinitions
}

function getWidgetForAllAudits(): v1.Widget[] {
    const audits = CORE_METRICS.audits;

    const widgetDefinitions: v1.Widget[] = audits.map(audit => {
        const title = formatAuditName(audit);
        const childWidgets = createWidgetsForAllPageTypes(audit);
        return createWidget({title: title, type: 'group', widgets: childWidgets})
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
