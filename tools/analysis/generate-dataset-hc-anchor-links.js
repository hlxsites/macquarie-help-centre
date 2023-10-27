import fs from 'fs';
import { Configuration, BasicCrawler, log, LogLevel, Dataset } from 'crawlee';
import { JSDOM } from 'jsdom';

// crawlee dataset for collected blocks data
let dataset;
const DATASET_NAME = 'dataset-hc-anchor-links';

process.env.CRAWLEE_STORAGE_DIR = `./storage-${DATASET_NAME}`;

const RESULT_STATUS = {
  PENDING: 'analysis pending',
  ERROR: 'error',
  DONE: 'done',
}

log.setLevel(LogLevel.DEBUG);

const crawler = new BasicCrawler({
    minConcurrency: 1,
    maxConcurrency: 1,

    // On error, retry each page at most once.
    maxRequestRetries: 1,

    async requestHandler({ request }) {
      // force await 5s.
      await new Promise(resolve => setTimeout(resolve, 5000));

      const url = request.url;
      let result = {
        url,
        redirect: null,
        anchorLinks: null,
        status: RESULT_STATUS.PENDING,
      };

      log.debug(`Processing ${url} ...`);

      try {
        const resp = await fetch(url, { redirect: 'manual' });

        console.log(`${url} status: ${resp.status} ${resp.headers.get('location')}`);
        if (resp.status === 301 || resp.status === 302) {
          result.redirect = resp.headers.get('location');
          result.status = RESULT_STATUS.DONE;
          console.log(`${url} redirects to ${result.redirect}`);
          return;
        }

        const { document } = (new JSDOM(await resp.text())).window;



        /**
         * Collect metadata
         */

        result.meta = [...document.querySelectorAll('meta')].map(el => {
          // extract attributes from el into object
          return Object.keys(el.attributes).reduce((acc, key) => {
            const attr = el.attributes[key];
            acc[attr.name] = attr.value;
            return acc;
          }, {});
        });



        /**
         * collect full page html
         */

        result.outerHTML = document.documentElement.outerHTML.replaceAll('\n', '').replaceAll(/\s+/gm, ' ').trim();



        /**
         * collect anchor links
         */

        result.anchorLinks = [...document.querySelectorAll('a[href]')].map(el => {
          const href = el.getAttribute('href');
          if (href.startsWith('#') && !el.closest('js-rf-tab-list') && !el.closest('header') && !el.closest('footer')) {
            const id = href.slice(1);
            return {
              href: href,
              text: el.textContent,
              targetEls: [...document.querySelectorAll(`#${id}`)].map(el => el.outerHTML),
            };
          }
        }).filter(Boolean);

        result.status = RESULT_STATUS.DONE;
      } catch (err) {
        log.error(`Error while processing ${url}: ${err.message || err}`);
        result.error = err.message || err;
        result.status = RESULT_STATUS.ERROR;
      } finally {
        log.debug(`result ## ${result.url} ##  ${result.status} ## ${result.locationMatchMsg || ''} ## ${JSON.stringify(result.contentType, '', 0)} ## ${result.error || ''}`);
        dataset.pushData(result);
      }
    },

    // This function is called if the page processing failed more than maxRequestRetries + 1 times.
    failedRequestHandler({ request }, error) {
      log.debug(`Request ${request.url} failed twice.`);
      log.debug(error);
    },
});



//
// main
//

// set crawlee global configuration
const config = Configuration.getGlobalConfig();
config.set('persistStorage', true);
config.set('purgeOnStart', true);
config.set('availableMemoryRatio', 0.8);
config.set('maxUsedCpuRatio', 0.9);
config.set('defaultDatasetId', DATASET_NAME);
config.set('defaultKeyValueStoreId', DATASET_NAME);
config.set('defaultRequestQueueId', DATASET_NAME);

console.log('Starting the crawler with config', config);

(async () => {
  // Open a named dataset
  dataset = await Dataset.open(DATASET_NAME);

  // Load URLs file passed in the command line arguments
  var urlsRaw = fs.readFileSync(process.argv[2], 'utf8').toString().split('\n').filter(line => line.trim() !== "");
  var urls = urlsRaw;
  await crawler.addRequests(urls);
  console.log(`Extracting data for ${urls.length} urls`);

  // Run the crawler and wait for it to finish.
  await crawler.run();

  console.log('Crawler finished.');
  console.log('stats', crawler.stats);
})();
