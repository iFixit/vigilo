import { client, v1, v2 } from '@datadog/datadog-api-client';


export default class DatadogClient {
    private clientConfiguration: client.Configuration;

    constructor({ api_key, app_key}: { api_key: string, app_key: string }) {
        const configurationOpts = {
            authMethods: {
                apiKeyAuth: api_key,
                appKeyAuth: app_key
            },
        };

        this.clientConfiguration = client.createConfiguration(configurationOpts);
    }

    async submitMetrics(metricName: string, dataPoints: v2.MetricPoint[], tags: string[] = []): Promise<void> {
        const metricsApiInstance = new v2.MetricsApi(this.clientConfiguration);

        const params: v2.MetricsApiSubmitMetricsRequest = {
            body: {
                series: [
                    {
                        metric: metricName,
                        type: 3, // gauge
                        points: dataPoints,
                        tags: tags
                    }
                ]
            }
        };

        const response = await metricsApiInstance.submitMetrics(params);

        if (response.errors?.length) {
            throw new Error(response.errors.join(', '));
        }
    }

    /**
     * Update the metadata for a metric.
     * @note The v1 MetricMetadata type is not compatible with the v2 MetricSeries
     * Metadata type. Ensure that only the v1 MetricMetadata type is used.
     */
    async updateMetricMetadata(metricName: string, metadata: v1.MetricMetadata): Promise<void> {
        const metricsApiInstance = new v1.MetricsApi(this.clientConfiguration);

        const params: v1.MetricsApiUpdateMetricMetadataRequest = {
            metricName,
            body: {
                ...metadata
            }
        };

        await metricsApiInstance.updateMetricMetadata(params);
    }

    async createDashboard(params: v1.DashboardsApiCreateDashboardRequest): Promise<void> {
        const dashboardsApiInstance = new v1.DashboardsApi(this.clientConfiguration);

        try {
            const data = await dashboardsApiInstance.createDashboard(params);
            console.log("Temporary dashboard created at: https://app.datadoghq.com/dashboard/" + data.id);
            console.log("Copy the newly added audit/graph and paste it in the Lighthouse Dashboard list.");
            console.log("Then delete the temporary dashboard.");
        } catch (error) {
            console.error(error);
        }
    }
}
