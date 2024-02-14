import { v1 } from '@datadog/datadog-api-client'
import Datadog from '@core/DatadogClient.js';
import dotenv from 'dotenv';
import lhConfig from '@config/lh-config.js';
import URLS from '@config/urls.json';
import TimeseriesWidget from './TimeseriesWidget.js';
import GroupWidget from './GroupWidget.js';
import QueryValueWidget from './QueryValueWidget.js';
import GraphRequestFactory from './GraphRequestFactory.js';

dotenv.config();

const HOST = process.env.DD_QUERY_HOST || 'docker-container';
const INSPECT_LIST = URLS;
const AUDITS = lhConfig.settings.onlyAudits || [];

(async () => {
    const dd = new Datadog({
        api_key: process.env.DD_API_KEY || '',
        app_key: process.env.DD_APP_KEY || '',
    });

    const body = createDashboardsApiBody();
    const response = await dd.createDashboard(body);
    console.log(response);
})();

function createDashboardsApiBody(): v1.DashboardsApiCreateDashboardRequest {
    return {
            body: {
                title: "Temporary Lighthouse Reports",
                templateVariables: [
                    {
                        name: "FORM_FACTOR",
                        prefix: "form_factor",
                        availableValues: ["desktop", "mobile"],
                        _default: "*",
                    },
                ],
                layoutType: "ordered",
                widgets: getWidgetForAllAudits(),
            }
        }
}

function getWidgetForAllAudits(): v1.Widget[] {
    const widgetDefinitions: v1.Widget[] = [];
    const timeseries = new TimeseriesWidget();
    const group = new GroupWidget();
    const queryValue = new QueryValueWidget();
    const graphRequestFactory = new GraphRequestFactory();

    const speedIndexQuery = `avg:lighthouse.speed_index.value{host:${HOST},$FORM_FACTOR,page_type:collections}`;

    const speedIndexTimeseriesRequest = graphRequestFactory.createTimeseriesRequest(speedIndexQuery);
    const speedIndexQueryValueRequest = graphRequestFactory.createQueryValueRequest(speedIndexQuery);
    speedIndexQueryValueRequest[0].conditionalFormats = [queryValue.createAlertMaker(4000, '>', 'red'), queryValue.createAlertMaker(2500, '>=', 'yellow'), queryValue.createAlertMaker(2500, '<', 'green')];

    const speedIndexQueryValueWidget = queryValue.createWidget({title: 'Collections', requests: speedIndexQueryValueRequest}, 2, 2, {x:0, y:0});

    const speedIndexTimeseriesWidget = timeseries.createWidget({title: 'Collections', requests: speedIndexTimeseriesRequest, markers: [timeseries.createAlertMaker({min:4000}, 'error'), timeseries.createAlertMaker({min: 2500, max: 4000}, 'warning'), timeseries.createAlertMaker({max:2500},'ok')]}, 4, 2, {x:2, y:0});

    const speedIndexGroupWidget = group.createWidget({title: 'Speed Index', widgets: [speedIndexQueryValueWidget, speedIndexTimeseriesWidget]});

    widgetDefinitions.push(speedIndexGroupWidget);
    return widgetDefinitions;
}