import fs from 'fs';
import path from 'path';

const DATASET = 'dataset-hc-anchor-links';

const JSON_FOLDER = `storage-${DATASET}/datasets/${DATASET}`;

(async() => {
  const jsonsInDir = fs.readdirSync(JSON_FOLDER).filter(file => path.extname(file) === '.json');

  for (let i = 0; i < jsonsInDir.length; i++) {
    const file = jsonsInDir[i];
    try {
      const fileData = fs.readFileSync(path.join(JSON_FOLDER, file));
      const json = JSON.parse(fileData.toString());
      
      /**
       * process blocks data
       */

      if (json.anchorLinks && json.anchorLinks.length > 0) {
        console.log(json.url);
      }
    } catch(e) {
      console.log('error', e);
    }
  }
})();
