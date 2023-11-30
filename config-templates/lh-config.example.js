/**
 * Visit https://github.com/GoogleChrome/lighthouse/blob/main/docs/configuration.md#more-examples
 * to learn more about the configuration options for Lighthouse.
 */
export default {
    extends: 'lighthouse:default',
    settings: {
        onlyAudits: [
            "largest-contentful-paint",
            "first-contentful-paint",
            "cumulative-layout-shift",
        ]
    }
}