import { v1 } from '@datadog/datadog-api-client';

export default class GraphRequestFactory {
    createTimeseriesRequest(query: string): v1.TimeseriesWidgetRequest[] {
        return [
            {
                responseFormat: "timeseries",
                queries: [
                    {
                        name: "query1",
                        dataSource: "metrics",
                        query: query
                    }
                ],
                formulas: [ {formula: "query1"} ],
                style: {
                    palette: "dog_classic",
                    lineType: "solid",
                    lineWidth: "normal",
                },
                displayType: "line",
            }
        ]
    }

    createQueryValueRequest(query: string): [v1.QueryValueWidgetRequest] {
        return [
            {
                responseFormat: "scalar",
                queries: [
                    {
                        name: "query1",
                        dataSource: "metrics",
                        query: query,
                        aggregator: "avg"
                    }
                ],
                formulas: [ {formula: "query1"} ],
            }
        ]
    }
}