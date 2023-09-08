import type { LaunchedChrome } from 'chrome-launcher';
import {launch} from 'chrome-launcher';

export default class ChromeRunner {
    private flags = ['--disable-gpu'];
    chrome!: LaunchedChrome

    constructor(headless: boolean = true) {
        if (headless) {
            this.flags.push('--headless')
        }
    }

    async start(): Promise<void> {
        this.chrome = await launch({ chromeFlags: this.flags })
    }

    stop() {
        this.chrome.kill()
    }
}