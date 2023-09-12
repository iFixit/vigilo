import ChromeRunner from "./ChromeRunner.js"
import LighthouseRunner from "./LighthouseRunner.js"
import Datadog from "./DatadogClient.js"
import {v2} from '@datadog/datadog-api-client'
import fs from 'node:fs'
import os from 'node:os'
import type { Flags, Result, Config } from 'lighthouse'
import lhDesktopConfig from 'lighthouse/core/config/lr-desktop-config.js'
import lhMobileConfig from 'lighthouse/core/config/lr-mobile-config.js'
import dotenv from 'dotenv'
dotenv.config();

function getAuditNumericValue(results: Result, audit: string): number {
    return results.audits[audit].numericValue || 0
}

function getAuditScore(results: Result, audit: string): number {
    return results.audits[audit].score || 0
}

function getFetchTime(results: Result): number {
    return Math.round(new Date(results.fetchTime).getTime() / 1000);
}

function retrieveDataPointsForAudits(results: Result, audits: string[]) {
    const timestamp = getFetchTime(results)
    const values: Record<string, Record<string, v2.MetricPoint>> = {}

    for (let audit of audits) {
        values[audit] = {
            "numericValue": {
                timestamp: timestamp,
                value: getAuditNumericValue(results, audit)
            },
            "score": {
                timestamp: timestamp,
                value: getAuditScore(results, audit)
            }
        }
    }

    return values
}

/**
 * Adds `rand={123..}` param to the urls to ensure we never hit a CDN cache.
 */
function addRandomParamToUrl(inspectList: Record<string, string[]>): void {
    for (const pageType in inspectList) {
        const urls = inspectList[pageType];

        inspectList[pageType] = urls.map(url => {
            const urlObject = new URL(url);
            urlObject.searchParams.append('rand', Math.floor(Math.random() * 1000000).toString());
            return urlObject.toString();
        });
    }
}

async function sendMetricsToDatadog(metricName: string, dataPoints: v2.MetricPoint[], tags: Record<string, string>) {
    const dd = new Datadog({
        api_key: process.env.DD_API_KEY || '',
        app_key: process.env.DD_APP_KEY || ''
    })
    const tagsArray = Object.entries(tags).map(([key, value]) => `${key}:${value}`)

    await dd.submitMetrics(metricName, dataPoints, tagsArray)
}

async function captureLighthouseMetrics(pageType: string, url: string, audits: string[], options: Flags = {}, config: Config = {}) {
    const chromeRunner = new ChromeRunner()
    const lighthouseRunner = new LighthouseRunner()

    const formFactor = config.settings?.formFactor || 'mobile'
    console.log(`Running Lighthouse for ${url} with form factor: ${formFactor}`);
    const port = await chromeRunner.start()
    const results = await lighthouseRunner.run(url, {port: port, ...options}, config)

    chromeRunner.stop()

    const metrics = retrieveDataPointsForAudits(results, audits)

    const tags = {
        'url': url,
        'page_type': pageType,
        'lighthouse_version': results.lighthouseVersion,
        'form_factor': results.configSettings.formFactor,
        'host': os.hostname()
    }

    console.log(`Sending metrics to Datadog for ${url}`)
    for (let [audit, dataPoints] of Object.entries(metrics)) {
        await sendMetricsToDatadog(`lighthouse.${audit}.value`, [dataPoints.numericValue], tags)
        await sendMetricsToDatadog(`lighthouse.${audit}.score`, [dataPoints.score], tags)
    }
    console.log(`Done sending metrics to Datadog for ${url}`)

    console.log(`Done running Lighthouse for ${url} with form factor: ${formFactor}\n`);
}
(async() => {
    const inspectList: Record<string, string[]> = JSON.parse(await fs.promises.readFile('urls.json', 'utf8'));
    addRandomParamToUrl(inspectList);

    const coreMetrics: Record<string, string[]> = JSON.parse(await fs.promises.readFile('metrics-config.json', 'utf8'));

    for (let [pageType, urls] of Object.entries(inspectList)) {
        console.log(`Capturing metrics for ${pageType} page(s)\n`)

        for (let url of urls) {
            await captureLighthouseMetrics(pageType, url, coreMetrics.audits, {}, lhDesktopConfig)

            await captureLighthouseMetrics(pageType, url, coreMetrics.audits, {}, lhMobileConfig)
        }

        console.log(`Done capturing metrics for ${pageType} page(s)\n`)
    }

    console.log('Done capturing metrics for all pages')
})()