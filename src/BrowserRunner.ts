import puppeteer from "puppeteer"
import type {Browser, Page, PuppeteerLaunchOptions} from "puppeteer"

export default class BrowserRunner {
    private launchOptions: PuppeteerLaunchOptions = {
        headless: 'new',
        // `headless: true` (default) enables old Headless;
        // `headless: 'new'` enables new Headless;
        // `headless: false` enables “headful” mode.
        // See https://developer.chrome.com/articles/new-headless/ for more details.
        args: [
            '--disable-gpu'
        ]
    }
    browser!: Browser

    constructor(headless: boolean = true) {
        if(!headless) {
            this.launchOptions.headless = false
        }
    }

    async start(): Promise<Page> {
        this.browser = await puppeteer.launch(this.launchOptions);
        return await this.browser.newPage();
    }

    async stop() {
        await this.browser.close();
    }
}