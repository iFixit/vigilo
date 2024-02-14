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

type QueryValueWidgetDefinition = Partial<v1.QueryValueWidgetDefinition> & {
    requests: [v1.QueryValueWidgetRequest]
}

const HOST = process.env.HOST || 'docker-container';
const INSPECT_LIST = URLS;
const AUDITS = lhConfig.settings.onlyAudits || [];

// Auditname -> {warning: "warning value", alert: "alert value"}
const ALERT_MARKERS_TIMESERIES = {
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
const ALERT_MARKERS_QUERY_VALUE = {
    'largest-contentful-paint': [
        {
            "comparator": ">",
            "value": 4000,
            "palette": "white_on_red"
        },
        {
            "comparator": ">=",
            "value": 2500,
            "palette": "white_on_yellow"
        },
        {
            "comparator": "<",
            "value": 2500,
            "palette": "white_on_green"
        }
    ],
    'first-contentful-paint': [
        {
            "comparator": ">",
            "value": 3,
            "palette": "white_on_red"
        },
        {
            "comparator": ">=",
            "value": 1.8,
            "palette": "white_on_yellow"
        },
        {
            "comparator": "<",
            "value": 1.8,
            "palette": "white_on_green"
        }
    ],
    'cumulative-layout-shift': [
        {
            "comparator": ">",
            "value": 0.25,
            "palette": "white_on_red"
        },
        {
            "comparator": ">=",
            "value": 0.1,
            "palette": "white_on_yellow"
        },
        {
            "comparator": "<",
            "value": 0.1,
            "palette": "white_on_green"
        }
    ],
    'total-blocking-time': [
        {
            "comparator": ">",
            "value": 600,
            "palette": "white_on_red"
        },
        {
            "comparator": ">=",
            "value": 200,
            "palette": "white_on_yellow"
        },
        {
            "comparator": "<",
            "value": 200,
            "palette": "white_on_green"
        }
    ],
    'speed-index': [
        {
            "comparator": ">",
            "value": 5.8,
            "palette": "white_on_red"
        },
        {
            "comparator": ">=",
            "value": 3.4,
            "palette": "white_on_yellow"
        },
        {
            "comparator": "<",
            "value": 3.4,
            "palette": "white_on_green"
        }
    ],
};

function fetchTimeseriesAlertMarkersForAudit(auditName: string) {
    return ALERT_MARKERS_TIMESERIES.hasOwnProperty(auditName) ? [
        {
            "label": "Alert",
            "value": ALERT_MARKERS_TIMESERIES[auditName].alert,
            "display_type": "error dashed"
        },
        {
            "label": "Warning",
            "value": ALERT_MARKERS_TIMESERIES[auditName].warning,
            "display_type": "warning dashed"
        }
    ] : []
}

function fetchQueryValueAlertMarkersForAudit(auditName: string) {
    return ALERT_MARKERS_QUERY_VALUE.hasOwnProperty(auditName) ? ALERT_MARKERS_QUERY_VALUE[auditName] : []
}

function createWidgetRequestsForTimeseriesMetric(audit: string, pageType: string): v1.TimeseriesWidgetRequest[] {
    return [
        {
            responseFormat: "timeseries",
            queries: [
                {
                    name: "query1",
                    dataSource: "metrics",
                    query: `avg:lighthouse.${formatMetricNameForDatadog(audit)}.value{host:${HOST},page_type:${formatMetricNameForDatadog(pageType)},$FormFactor} by {url, form_factor}`
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

function createWidgetRequestsForQueryValueMetric(audit: string, pageType: string, alerts: v1.WidgetConditionalFormat[]): [v1.QueryValueWidgetRequest] {
    return [
        {
            responseFormat: "scalar",
            queries: [
                {
                    name: "query1",
                    dataSource: "metrics",
                    query: `avg:lighthouse.${formatMetricNameForDatadog(audit)}.value{host:${HOST},page_type:${formatMetricNameForDatadog(pageType)},$FormFactor}`,
                    aggregator: "avg"
                }
            ],
            formulas: [ {formula: "query1"} ],
            conditionalFormats: alerts
        }
    ]
}

function createQueryValueWidget(widget: QueryValueWidgetDefinition, width: number, height: number, x: number, y: number): v1.Widget {
    return {
        definition: {
            title: "",
            titleSize: "16",
            titleAlign: "left",
            type: "query_value",
            autoscale: true,
            precision: 2,
            ...widget
        },
        layout: {
            width: width,
            height: height,
            x: x,
            y: y
        }
    }
}

function createTimeseriesWidget(widget: TimeseriesWidgetDefinition, width: number, height: number, x: number, y: number): v1.Widget {
    return {
        definition: {
            title: "",
            titleSize: "16",
            titleAlign: "left",
            type: "timeseries",
            showLegend: true,
            ...widget
        },
        layout: {
            width: width,
            height: height,
            x: x,
            y: y
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

function createWidgetPairsForAllPageTypes(audit: string): v1.Widget[] {
    const pageTypes = Object.keys(INSPECT_LIST);

    const queryValueSize = {width: 2, height: 2};
    const timeseriesSize = {width: 4, height: 2};

    const queryValueAlertMarkers = fetchQueryValueAlertMarkersForAudit(audit);
    const timeseriesAlertMarkers = fetchTimeseriesAlertMarkersForAudit(audit);

    const widgetDefinitions:v1.Widget[] = [];

    let x = 0;
    let y = 0;

    for (const pageType of pageTypes) {
        if (x === 12) {
            x = 0;
            y += 2;
        }

        const queryValueRequests = createWidgetRequestsForQueryValueMetric(audit, pageType, queryValueAlertMarkers);
        const timeseriesRequests = createWidgetRequestsForTimeseriesMetric(audit, pageType);

        const queryValueWidget = createQueryValueWidget({title: pageType, requests: queryValueRequests }, queryValueSize.width, queryValueSize.height, x, y);

        x += queryValueSize.width;

        const timeseriesWidget = createTimeseriesWidget(
            {
                title: pageType,
                requests: timeseriesRequests,
                markers: timeseriesAlertMarkers,
                customLinks: [
                    {
                        "label": "Visit Webpage",
                        "link": "{{url.value}}"
                    }
                ]
            },
            timeseriesSize.width,
            timeseriesSize.height,
            x,
            y
        );

        x += timeseriesSize.width;

        widgetDefinitions.push(queryValueWidget, timeseriesWidget);
    }

    return widgetDefinitions
}

function getWidgetForAllAudits(): v1.Widget[] {
    const widgetDefinitions: v1.Widget[] = AUDITS.map(audit => {
        const title = formatAuditName(audit);
        const childWidgets = createWidgetPairsForAllPageTypes(audit);
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
