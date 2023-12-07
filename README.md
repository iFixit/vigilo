# Vigilo
🚧 Still in development 🚧

Vigilo is a monitoring tool that automates Lighthouse audits and sends key metrics to Datadog. Designed to keep a vigilant eye on your web application's performance and accessibility.

### Local Setup
1. Clone the repo
2. Run `pnpm run setup`
3. Add the metrics you want to track to the `onlyAudits` property in the `src/config/lh-config.js` file
4. Add your URLs to the `src/config/urls.json` file
5. Add your Datadog API key and Datadog Application key to the `.env` file
6. Run `pnpm run build`

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

This is useful when there were changes to the config files (`lh-config.js`, and `url.json`) and we want to create the dashboards for the new `audits`/`page types`.

#### Updating Metadata of Metrics in Datadog
1. After setup, run `pnpm run update-metric-metadata` to use the CLI tool to update the metadata of the metrics in Datadog.
2. The CLI tool will give you a list of options to pass as well as information on how to use the tool.

### Docker Setup

1. Similar [Local Setup](#local-setup) steps 1-5
2. Run `docker build -t vigilo .`

#### Docker Usage
1. After setup, run `pnpm start:docker` to run vigilo and send metrics to Datadog


### Building

- Run `pnpm run build` to build all packages

- Run `pnpm run build:core` to build the core package

- Run `pnpm run build:scripts` to build the standalone utility scripts to interact with Datadog

If you want additional options for the build process, you can use run `pnpm build --help` or `node build.js --help` to see the available options.