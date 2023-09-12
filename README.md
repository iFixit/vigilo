# Vigilo
🚧 Still in development 🚧

Vigilo is a monitoring tool that automates Lighthouse audits and sends key metrics to Datadog. Designed to keep a vigilant eye on your web application's performance and accessibility.

### Setup
1. Clone the repo
2. Run `pnpm install`
3. Run `pnpm run build`
4. Run `cp .env.template .env`
5. Add your Datadog API key and Datadog Application key to the `.env` file
6. Run `cp urls.example.json urls.json`
7. Add your URLs to the `urls.json` file
8. Run `cp metrics.example.json metrics.json`
9. Add the metrics you want to send to Datadog to the `metrics.json` file

### Usage
1. After setup, run `pnpm start` to run vigilo and send metrics to Datadog
