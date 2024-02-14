import { v1 } from '@datadog/datadog-api-client';

export type GroupWidgetDefinition = Partial<v1.GroupWidgetDefinition> & {
    widgets: v1.Widget[]
};

export type TimeseriesWidgetDefinition = Partial<v1.TimeseriesWidgetDefinition> & {
    requests: v1.TimeseriesWidgetRequest[]
};

export type QueryValueWidgetDefinition = Partial<v1.QueryValueWidgetDefinition> & {
    requests: [v1.QueryValueWidgetRequest]
};
