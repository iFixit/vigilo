import ChromeRunner from "./ChromeRunner.js"
import LighthouseRunner from "./LighthouseRunner.js"
import Datadog from "./DatadogClient.js"
import {v2} from '@datadog/datadog-api-client'
import fs from 'node:fs'
import type { Result } from 'lighthouse'
import os from 'node:os'
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
(async() => {
    const dd = new Datadog({
        api_key: process.env.DD_API_KEY || '',
        app_key: process.env.DD_APP_KEY || ''
    })

    const inspectList: Record<string, string[]> = JSON.parse(await fs.promises.readFile('urls.json', 'utf8'));

    const coreMetrics: Record<string, string[]> = JSON.parse(await fs.promises.readFile('metrics-config.json', 'utf8'));

    for (let [pageType, urls] of Object.entries(inspectList)) {
        for (let url of urls) {
            const chromeRunner = new ChromeRunner(false)
            const lighthouseRunner = new LighthouseRunner()

            const port = await chromeRunner.start()
            const results = await lighthouseRunner.run(url, {port: port})

            chromeRunner.stop()

            const metrics = retrieveDataPointsForAudits(results, coreMetrics['audits'])

            const tags = {
                'url': url,
                'page_type': pageType,
                'lighthouse_version': results.lighthouseVersion,
                'host': os.hostname()
            }

            const tagsArray = Object.entries(tags).map(([key, value]) => `${key}:${value}`)

            for (let [audit, dataPoints] of Object.entries(metrics)) {
                await dd.submitMetrics(`lighthouse.${audit}.value`, [dataPoints.numericValue], tagsArray)
                await dd.submitMetrics(`lighthouse.${audit}.score`, [dataPoints.numericValue], tagsArray)
            }
        }
    }
})()