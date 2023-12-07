import lighthouse from 'lighthouse';
import type {Flags, Result, Config} from 'lighthouse';
import type {Page} from 'puppeteer';

export default class LighthouseRunner {
    private lhOptions: Flags = {
        output: 'json',
        logLevel: 'silent',
    }

    async run(url: string, lhOptions: Flags = {}, config: Config = {}, page?: Page): Promise<Result> {
        const result = await lighthouse(url, {...this.lhOptions, ...lhOptions}, config, page)

        if (result) {
            return result.lhr
        }

        throw new Error('Lighthouse failed to run')
    }
}