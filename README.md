# Vigilo
🚧 Still in development 🚧

Vigilo is a monitoring tool that automates Lighthouse audits and sends key metrics to Datadog. Designed to keep a vigilant eye on your web application's performance and accessibility.

### Local Setup
1. Clone the repo
2. Run `pnpm install`
3. Run `pnpm run build`
4. Run `cp .env.template .env`
5. Add your Datadog API key and Datadog Application key to the `.env` file
6. Run `cp urls.example.json urls.json`
7. Add your URLs to the `urls.json` file
8. Run `cp metrics-config.example.json metrics-config.json`
9. Add the metrics you want to send to Datadog to the `metrics.json` file

⚠️ If you are setting this up on a Windows machine via WSL, then you will need to run the following commands to ensure the correct linux dependencies are installed:
**Make sure dependencies are up to date**
```
sudo apt update && sudo apt -y upgrade && sudo apt -y autoremove
```
**Download and Install Chrome**
```
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt -y install ./google-chrome-stable_current_amd64.deb
```
**Check Chrome was Successfully Installed**
```
google-chrome --version
```
#### Local Usage
1. After setup, run `pnpm start` to run vigilo and send metrics to Datadog

#### Generate Dashboards in Datadog
1. After setup, run `pnpm run create-dashboard` to create temporary dashboard in Datadog.
2. Copy the newly created section in the temporary dashboard.
3. Paste it in the existing `Lighthouse Reports` dashboard.
4. Delete the temporary dashboard.

This is useful when there were changes to the config files (`metrics-config.json`, and `url.json`) and we want to create the dashboards for the new `audits`/`page types`.

### Docker Setup

1. Clone the repo
2. Run `cp .env.template .env`
3. Add your Datadog API key and Datadog Application key to the `.env` file
4. Run `cp urls.example.json urls.json`
5. Add your URLs to the `urls.json` file
6. Run `cp metrics-config.example.json metrics-config.json`
7. Add the metrics you want to send to Datadog to the `metrics.json` file
8. Run `docker build -t vigilo .`

#### Docker Usage
1. After setup, run `docker run --rm vigilo` to run vigilo and send metrics to Datadog
