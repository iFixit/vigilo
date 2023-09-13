import { client, v2 } from '@datadog/datadog-api-client';


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
}