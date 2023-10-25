import fs from 'fs';
import path from 'path';

const DATASET = 'dataset-hc-anchor-links';

const JSON_FOLDER = `storage-${DATASET}/datasets/${DATASET}`;

(async() => {
  const jsonsInDir = fs.readdirSync(JSON_FOLDER).filter(file => path.extname(file) === '.json');

  const anchorLinks = [];
  const htmlTables = [];
  const listsWithStartAttr = [];

  for (let i = 0; i < jsonsInDir.length; i++) {
    const file = jsonsInDir[i];
    try {
      const fileData = fs.readFileSync(path.join(JSON_FOLDER, file));
      const json = JSON.parse(fileData.toString());
      
      /**
       * process anchor links data
       */

      if (json.anchorLinks && json.anchorLinks.length > 0) {
        anchorLinks.push({
          file,
          url: json.url,
          anchorLinks: json.anchorLinks,
        });
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
      }

    } catch(e) {
      console.log('error', e);
    }
  }

  // report

  // anchor links
  console.log('Pages with anchor links:', anchorLinks.length);
  anchorLinks.forEach(({ url, file, anchorLinks }) => {
    console.log(`${url} (${file}): ${anchorLinks.length}`);
  });

  // html tables
  console.log('');
  console.log('Pages with html tables:', htmlTables.length);
  htmlTables.forEach(({ url, file, n }) => {
    console.log(`${url} (${file}): ${n}`);
  });

  // lists with start attr
  console.log('');
  console.log('Pages with lists with start attr:', listsWithStartAttr.length);
  listsWithStartAttr.forEach(({ url, file, n }) => {
    console.log(`${url} (${file}): ${n}`);
  });
})();
