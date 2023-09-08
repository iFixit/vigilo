import lighthouse from 'lighthouse';
import type {Flags, Result, Config} from 'lighthouse';

export default class LighthouseRunner {
    private lhOptions: Flags = {
        output: 'json',
        logLevel: 'silent',
    }

    async run(url: string, lhOptions: Flags = {}, config: Config = {}): Promise<Result> {
        const result = await lighthouse(url, {...this.lhOptions, ...lhOptions}, config)

        if (result) {
            return result.lhr
        }

        throw new Error('Lighthouse failed to run')
    }
}