import fs from 'fs';
import path from 'path';

import  ExcelJS from 'exceljs';


const DATASET = 'dataset-hc-anchor-links';
const OUTPUT_FILE = `${DATASET}-analysis.xlsx`;

const XLSX_BLOG_REQS_SHEET_NAME = DATASET;
const XLSX_BLOG_REQS_SHEET_HEADERS = [ 'url', 'redirect', 'anchor links', 'html tables', 'list with start attribute', 'video embed', 'feedback widget', 'template metatag', '429 Too Many Requests' ];


const JSON_FOLDER = `storage-${DATASET}/datasets/${DATASET}`;

(async() => {
  const jsonsInDir = fs.readdirSync(JSON_FOLDER).filter(file => path.extname(file) === '.json');
  
  const workbook = new ExcelJS.Workbook();
  const sheet1 = workbook.addWorksheet(XLSX_BLOG_REQS_SHEET_NAME);
  sheet1.addRow(XLSX_BLOG_REQS_SHEET_HEADERS);
  sheet1.autoFilter = `A1:${String.fromCharCode(97 + (XLSX_BLOG_REQS_SHEET_HEADERS.length - 1))}1`;

  const anchorLinks = [];
  const htmlTables = [];
  const listsWithStartAttr = [];
  const pagesWithVideos = [];
  const redirects = [];
  const tooManyRequest = [];
  const helpFeedbackWidget = [];
  const templateMeta = [];
  const threeColumnBlock = [];

  const pageData = [];

  for (let i = 0; i < jsonsInDir.length; i++) {
    const file = jsonsInDir[i];
    try {
      const fileData = fs.readFileSync(path.join(JSON_FOLDER, file));
      const json = JSON.parse(fileData.toString());

      const template = json.meta?.filter(m => m.name === 'template')[0]?.content;
      if (template) {
        templateMeta.push({
          file,
          url: json.url,
          template,
        });
      }

      const data = {
        url: json.url,
        redirect: '',
        anchorLinks: 0,
        htmlTables: 0,
        listWithStartAttr: 0,
        videoEmbed: 0,
        tooManyRequests: 0,
        helpFeedbackWidget: 0,
        templateMeta: template || '',
      };

      /**
       * process anchor links data
       */

      if (json.anchorLinks && json.anchorLinks.length > 0) {
        anchorLinks.push({
          file,
          url: json.url,
          anchorLinks: json.anchorLinks,
        });
        data.anchorLinks = json.anchorLinks.length;
      }
      
      /**
       * process html table data
       */

      if (json.outerHTML?.includes('<table')) {
        const n = json.outerHTML.split('<table').length - 1;
        htmlTables.push({
          file,
          url: json.url,
          n,
        });
        data.htmlTables = n;
      }
      
      /**
       * process lists using "start" attribute
       */

      if (json.outerHTML?.includes('start=')) {
        const n = json.outerHTML.split('start=').length - 1;
        listsWithStartAttr.push({
          file,
          url: json.url,
          n,
        });
        data.listWithStartAttr = n;
      }
      
      /**
       * collect pages with video
       */

      if (json.outerHTML?.includes('iframe') && json.outerHTML?.includes('video')) {
        pagesWithVideos.push({
          file,
          url: json.url,
        });
        data.videoEmbed = 1;
      }
      
      /**
       * collect redirects
       */

      if (json.redirect) {
        redirects.push({
          file,
          url: json.url,
        });
        data.redirect = json.redirect;
      }
      
      /**
       * collect pages which have the help feedback widget
       */

      if (json.outerHTML?.includes('help-feedback')) {
        const n = json.outerHTML.split('help-feedback').length - 1;
        helpFeedbackWidget.push({
          file,
          url: json.url,
          n,
        });
        data.helpFeedbackWidget = n;
      }
      
      /**
       * collect pages with three-column-block
       */

      if (json.outerHTML?.includes('class="three-column-block"')) {
        const n = json.outerHTML.split('class="three-column-block"').length - 1;
        threeColumnBlock.push({
          file,
          url: json.url,
          n,
        });
        console.log('three-column-block', json.url, n);
        // data.helpFeedbackWidget = n;
      }
      
      /**
       * collect 429 Too Many Requests
       */

      if (json.outerHTML?.includes('429 Too Many Requests')) {
        tooManyRequest.push({
          file,
          url: json.url,
        });
        data.tooManyRequests = 1;
      }

      pageData.push(data);
    } catch(e) {
      console.log('error', e);
    }
  }

  // report
  console.log('Pages with anchor links:', anchorLinks.length);
  console.log('Pages with html tables:', htmlTables.length);
  console.log('Pages with lists with start attr:', listsWithStartAttr.length);
  console.log('Pages with videos:', pagesWithVideos.length);
  console.log('Pages with redirects:', redirects.length);
  console.log('Pages with help feedback widget:', helpFeedbackWidget.length);
  console.log('Pages with template metatag:', templateMeta.length);
  console.log('Pages with three-column-block:', threeColumnBlock.length);
  console.log('Pages with 429 Too Many Requests:', tooManyRequest.length);

  // write to excel
  pageData.forEach(page => {
    sheet1.addRow([ page.url, page.redirect, page.anchorLinks, page.htmlTables, page.listWithStartAttr, page.videoEmbed, page.helpFeedbackWidget, page.templateMeta, page.tooManyRequests ]);
  });
  await workbook.xlsx.writeFile(OUTPUT_FILE);
})();
