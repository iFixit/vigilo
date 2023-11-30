import Datadog from "@core/DatadogClient.js"
import dotenv from 'dotenv'
import { v1 } from '@datadog/datadog-api-client'
import lhConfig from "@config/lh-config.js"
import URLS from "@config/urls.json" assert { type: "json" }
import { formatAuditName, formatMetricNameForDatadog } from '@core/utils.js'

dotenv.config();

type GroupWidgetDefinition = Partial<v1.GroupWidgetDefinition> & {
    widgets: v1.Widget[]
}

type TimeseriesWidgetDefinition = Partial<v1.TimeseriesWidgetDefinition> & {
    requests: v1.TimeseriesWidgetRequest[]
}

const HOST = 'ubreakit.com';
const INSPECT_LIST = URLS;
const AUDITS = lhConfig.settings.onlyAudits || [];

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

function createWidgetRequestsForMetric(audit: string, pageType: string): v1.TimeseriesWidgetRequest[] {
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

function createTimeseriesWidget(widget: TimeseriesWidgetDefinition): v1.Widget {

    return {
        definition: {
            title: "",
            titleSize: "16",
            titleAlign: "left",
            type: "timeseries",
            showLegend: true,
            ...widget
        }
    }
}

function createGroupWidget(widget: GroupWidgetDefinition): v1.Widget {
    return {
        definition: {
            title: "",
            titleAlign: "left",
            type: "group",
            layoutType: "ordered",
            ...widget
        }
    }
}

function createTimeseriesWidgetsForAllPageTypes(audit: string): v1.Widget[] {
    const pageTypes = Object.keys(INSPECT_LIST);
    const alertMarkers = fetchAlertMarkersForAudit(audit);
    const widgetDefinitions = pageTypes.map(pageType => {
        const requests = createWidgetRequestsForMetric(audit, pageType);
        return createTimeseriesWidget({title: pageType, requests: requests, markers: alertMarkers})
    })

    return widgetDefinitions
}

function getWidgetForAllAudits(): v1.Widget[] {
    const widgetDefinitions: v1.Widget[] = AUDITS.map(audit => {
        const title = formatAuditName(audit);
        const childWidgets = createTimeseriesWidgetsForAllPageTypes(audit);
        return createGroupWidget({title: title, widgets: childWidgets})
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
