import fs from 'fs';
import { Configuration, PuppeteerCrawler, log, LogLevel, Dataset } from 'crawlee';
import { JSDOM } from 'jsdom';
import { Url, Puppeteer } from 'franklin-bulk-shared';
import pUtils from 'path';

// crawlee dataset for collected blocks data
let dataset;
const DATASET_NAME = 'dataset-html-tables-screenshots';

process.env.CRAWLEE_STORAGE_DIR = `./storage-${DATASET_NAME}`;

const SCREENSHOTS_FOLDER = `${process.env.CRAWLEE_STORAGE_DIR}/screenshots`;

const RESULT_STATUS = {
  PENDING: 'analysis pending',
  ERROR: 'error',
  DONE: 'done',
}

log.setLevel(LogLevel.DEBUG);

const crawler = new PuppeteerCrawler({
    minConcurrency: 1,
    maxConcurrency: 1,

    // On error, retry each page at most once.
    maxRequestRetries: 1,

    async requestHandler({ page, request }) {
      // force await 5s.
      await new Promise(resolve => setTimeout(resolve, 2000));


      const url = request.url;
      let result = {
        url,
        redirect: null,
        anchorLinks: null,
        status: RESULT_STATUS.PENDING,
      };

      log.debug(`Processing ${url} ...`);

      try {
        await page.setViewport({
          width: 1200,
          height: 1000,
          deviceScaleFactor: 1,
        });

        await Puppeteer.smartScroll(page, { postReset: true });



        const [p, filename] = Url.buildPathAndFilenameWithPathFromUrl(url, 'current', 'json');
        const path = pUtils.join(SCREENSHOTS_FOLDER, p);
        if (!fs.existsSync(path)) {
          fs.mkdirSync(path, { recursive: true });
        }

        fs.writeFileSync(pUtils.join(path, filename), JSON.stringify({
          url,
          contentType: await page.evaluate(() => document.contentType),
          title: await page.evaluate(() => document.title),
        }));

        
        const tables = await page.$$('table')
        
        for (let i = 0; i < tables.length; i++) {
          const table = tables[i];

          const [p, filename] = Url.buildPathAndFilenameWithPathFromUrl(url, `table-${i+1}-current-screenshot`, 'png');
          const path = pUtils.join(SCREENSHOTS_FOLDER, p);
          // if (!fs.existsSync(path)) {
          //   fs.mkdirSync(path, { recursive: true });
          // }

          await table.screenshot({ path: pUtils.join(path, filename) });
        }

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
