import BrowserRunner from "./BrowserRunner.js"
import LighthouseRunner from "./LighthouseRunner.js"
import Datadog from "./DatadogClient.js"
import {v1, v2} from '@datadog/datadog-api-client'
import fs from 'node:fs'
import os from 'node:os'
import type { Flags, Result, Config } from 'lighthouse'
import lhConfig from '@config/lh-config.js';
import URLS from '@config/urls.json' assert { type: "json" };
import lhDesktopConfig from 'lighthouse/core/config/lr-desktop-config.js'
import lhMobileConfig from 'lighthouse/core/config/lr-mobile-config.js'
import {deepMerge} from './utils.js'
import dotenv from 'dotenv'
dotenv.config();

function getAuditNumericValue(results: Result, audit: string): number {
    return results.audits[audit].numericValue || 0
}

function getAuditNumericUnitType(results: Result, audit: string): string {
    if (results.audits[audit].numericUnit === 'unitless') {
        return 'unit'
    }
    return results.audits[audit].numericUnit || 'unit'
}

function getAuditScore(results: Result, audit: string): number {
    return results.audits[audit].score || 0
}

function getAuditDescription(results: Result, audit: string): string {
    return results.audits[audit].description || ''
}

function getFetchTime(results: Result): number {
    return Math.round(new Date(results.fetchTime).getTime() / 1000);
}

function retrieveDataPointsForAudits(results: Result, audits: string[]) {
    const timestamp = getFetchTime(results)
    const values = {}

    for (let audit of audits) {
        values[audit] = {
            "dataPoints" : {
                "numericValue": {
                    timestamp: timestamp,
                    value: getAuditNumericValue(results, audit)
                },
                "score": {
                    timestamp: timestamp,
                    value: getAuditScore(results, audit)
                }
            },
            "metadata": {
                "unit": getAuditNumericUnitType(results, audit),
                "description": getAuditDescription(results, audit)
            }
        }
    }

    return values
}

/**
 * Adds `rand={123..}` param to the urls to ensure we never hit a CDN cache.
 */
function addRandomParamToUrl(inspectList: Record<string, string[]>): Record<string, string[]> {
    const updatedInspectList: Record<string, string[]> = structuredClone(inspectList);

    for (const pageType in updatedInspectList) {
        const urls = updatedInspectList[pageType];

        updatedInspectList[pageType] = urls.map(url => {
            const urlObject = new URL(url);
            urlObject.searchParams.append('rand', Math.floor(Math.random() * 1000000).toString());
            return urlObject.toString();
        });
    }
    return updatedInspectList;
}

async function sendMetricsToDatadog(metricName: string, dataPoints: v2.MetricPoint[], tags: Record<string, string>, metadata?: v1.MetricMetadata) {
    const dd = new Datadog({
        api_key: process.env.DD_API_KEY || '',
        app_key: process.env.DD_APP_KEY || ''
    })
    const tagsArray = Object.entries(tags).map(([key, value]) => `${key}:${value}`)

    await dd.submitMetrics(metricName, dataPoints, tagsArray)

    if(metadata) {
        await dd.updateMetricMetadata(metricName, metadata)
    }
}

async function captureLighthouseMetrics(pageType: string, url: string, audits: string[], options: Flags = {}, config: Config = {}) {
    const browserRunner = new BrowserRunner()
    const lighthouseRunner = new LighthouseRunner()

    const formFactor = config.settings?.formFactor || 'mobile'
    console.log(`Running Lighthouse for ${url} with form factor: ${formFactor}`);
    const page = await browserRunner.start()
    const results = await lighthouseRunner.run(url, {...options}, config, page)

    await browserRunner.stop()

    const metrics = retrieveDataPointsForAudits(results, audits)

    const isDocker = process.env.DOCKER === 'true'
    const hostName = isDocker ? `docker-container` : os.hostname();

    const tags = {
        'url': url,
        'page_type': pageType,
        'lighthouse_version': results.lighthouseVersion,
        'form_factor': results.configSettings.formFactor,
        'host': hostName
    }

    console.log(`Sending metrics to Datadog for ${url}`)

    for (const audit of Object.keys(metrics)) {
        const {dataPoints, metadata} = metrics[audit];

        await sendMetricsToDatadog(`lighthouse.${audit}.value`, [dataPoints.numericValue], tags, metadata)

        await sendMetricsToDatadog(`lighthouse.${audit}.score`, [dataPoints.score], tags, {...metadata, unit: 'unit'})
    }

    console.log(`Done sending metrics to Datadog for ${url}`)

    console.log(`Done running Lighthouse for ${url} with form factor: ${formFactor}\n`);
}
(async() => {
    let inspectList: Record<string, string[]> = URLS;
    inspectList = addRandomParamToUrl(inspectList);

    const audits = lhConfig.settings.onlyAudits || []

    for (let [pageType, urls] of Object.entries(inspectList)) {
        console.log(`Capturing metrics for ${pageType} page(s)\n`)

        for (let url of urls) {
            await captureLighthouseMetrics(pageType, url, audits, {}, deepMerge(lhDesktopConfig, lhConfig))

            await captureLighthouseMetrics(pageType, url, audits, {}, deepMerge(lhMobileConfig, lhConfig))
        }

        console.log(`Done capturing metrics for ${pageType} page(s)\n`)
    }

    console.log('Done capturing metrics for all pages')
})()