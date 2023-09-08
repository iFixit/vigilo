import lighthouse from 'lighthouse';
import type {Flags, Result} from 'lighthouse';

export default class LighthouseRunner {
    private lhOptions: Flags = {
        output: 'json',
        logLevel: 'silent',
    }

    async run(url: string, lhOptions: Flags = {}): Promise<Result> {
        const result = await lighthouse(url, {...this.lhOptions, ...lhOptions})

        if (result) {
            return result.lhr
        }

        throw new Error('Lighthouse failed to run')
    }
}