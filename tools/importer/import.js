
/**
 * const
 */

const CATEGORY_FRAGMENT_MAP = {
  'personal': 'https://main--macquarie-help-centre--hlxsites.hlx.live/help/fragment/experience-fragment',
  'business': 'https://main--macquarie-help-centre--hlxsites.hlx.live/help/fragment/business-fragment',
  'advisers': 'https://main--macquarie-help-centre--hlxsites.hlx.live/help/fragment/advisers-fragment',
  'brokers': 'https://main--macquarie-help-centre--hlxsites.hlx.live/help/fragment/brokers-fragment',
};



/**
 * functions
 */

const createMetadata = (main, document) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.innerHTML.replace(/[\n\t]/gm, '');
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  const shorttitle = document.querySelector('[property="og:title"]');
  if (shorttitle) {
    meta.shortTitle = shorttitle.content;
  }

  const keywords = document.querySelector('[name="keywords"]');
  if (keywords) {
    meta.keywords = keywords.content;
  }

  const theme = document.querySelector('[name="template"]');
  if (theme && theme.content === 'help-centre-short-article-template') {
    meta.Template = 'short-article';
  } else if (theme && theme.content === 'help-centre-long-article-template') {
    meta.Template = 'long-article';
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};

function makeLinks(main) {
  main.querySelectorAll('a').forEach((a) => {
    try {
      const ori = a.href;
      let u;
      if (a.href.startsWith('http://') || a.href.startsWith('https://')) {
        return;
      }

      if (a.href.startsWith('/help')) {
        const lowercaseHref = a.href.toLowerCase();
        u = new URL(lowercaseHref, 'https://main--macquarie-help-centre--hlxsites.hlx.page/');
      } else if (a.href.startsWith('/assets')) {
        u = new URL(a.href, 'https://www.macquarie.com.au/');
      } else if (a.href.startsWith('/')) {
        u = new URL(a.href, 'https://www.macquarie.com.au/');
      } else {
        u = new URL(a.href);
        //u.hostname = 'main--macquarie-help-centre--hlxsites.hlx.page';
      }

      // Remove .html extension
      if (u.pathname.endsWith('.html')) {
        u.pathname = u.pathname.slice(0, -5);
      }

      a.href = u.toString();

      if (a.textContent === ori) {
        a.textContent = a.href;
      }
    } catch (err) {
      console.warn(`Unable to make absolute link for ${a.href}: ${err.message}`);
    }
  });
}

function createEmbedBlock(main, document) {
  main.querySelectorAll('.video-component').forEach((module) => {
    const data = [['video']];
    const pars = [];

    // poster image
    const img = module.querySelector(':scope img');
    if (img) {
      const p = document.createElement('p');
      p.append(img);
      pars.push(p);
    }

    // iframe tag
    const video = module.querySelector('.video__iframe-container iframe.modal__frame');
    if (video) {
      const p = document.createElement('p');
      const a = p.appendChild(document.createElement('a'));
      const videoSrc = video.getAttribute('src');
      const title = video.getAttribute('title');

      let videoDesc = "Watch Now";
      const videoDescEl = module.querySelector('.video__details .video__description');
      if (videoDescEl) {
        videoDesc = videoDescEl.textContent;
      }

      a.href = videoSrc;
      a.textContent = videoDesc;
      p.append(a);

      const pTitle = document.createElement('h2');
      pTitle.textContent = title;

      pars.push(p);
      pars.push(pTitle);
    }

    const videoTime = module.querySelector('.video__details .video__timestamp');
    if (videoTime) {
      const pTime = document.createElement('p');
      pTime.textContent = videoTime.textContent;
      pars.push(pTime);
    }

    data.push([[...pars]]);

    const table = WebImporter.DOMUtils.createTable(data, document);
    module.replaceWith(table);
  });
}

function createAccordion(main, document) {
  main.querySelectorAll('.accordion-layout').forEach((module) => {
    const keyElements = module.querySelectorAll('.accordion__button');
    const valueElements = module.querySelectorAll('.accordion-layout__accordions-container__single-accordion--content__container');

    const accordionData = [['Accordion (content-center)']];

    keyElements.forEach((keyElement, index) => {
      const keyText = keyElement.textContent.trim();

      if (valueElements[index]) {
        const valueText = valueElements[index].textContent.trim();

        if (keyText && valueText) {
          accordionData.push([keyText, valueText]);
        }
      }
    });

    if (accordionData.length >= 1) {
      const table = WebImporter.DOMUtils.createTable(accordionData, document);
      module.replaceWith(table);
    }
  });
}

function setPlayIcons(main, document) {
  main.querySelectorAll('.image').forEach((image) => {
    // iframe tag
    const video = image.querySelector('a.cmp-image__link');
    if (video) {
      const iconLink = document.createElement('a');
      iconLink.href = video.getAttribute('href');
      if (iconLink.href.includes('google')) {
        iconLink.textContent = ':google-play-icon:';
      } else if (iconLink.href.includes('apple')) {
        iconLink.textContent = ':app-store-logo:';
      }

      // Append the icon link to the image
      image.replaceWith(iconLink);
    }
  });
}

// javascript function to fix heading levels in a page, to not skip levels
function fixHeadings(rootEl) {
  const headings = [...rootEl.querySelectorAll('h2, h3, h4, h5, h6')];
  const maxLevel = headings.reduceRight((max, heading) => {
    const level = parseInt(heading.tagName.charAt(1), 10);
    return (level > 1 &&  level < max) ? level : max;
  }, 6);
  console.log(`maxLevel: ${maxLevel}`);
  const levelGap = maxLevel - 2;
  if (levelGap > 0) {
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1), 10);
      heading.outerHTML = `<h${level - levelGap}>${heading.innerHTML}</h${level - levelGap}>`;
    });
  }
}



/**
 * main
 */

export default {
  onLoad: async ({ document, url, params }) => {
    try {
      await new Promise((resolve, reject) => {
        const startTime = Date.now();
        const intervalId = setInterval(() => {
          const element = document.querySelector('img.cmp-image__image--is-loading');
          if (!element) {
            clearInterval(intervalId);
            resolve(element);
          } else if (Date.now() - startTime >= 10000) {
            clearInterval(intervalId);
            reject(new Error('Timeout waiting for element for not be present anymore'));
          }
        }, 250);
      });

      // if the page contains an embedded video, wait for the related iframe to have the title attribute
      if (document.querySelector('.video iframe')) {
        await WebImporter.Loader.waitForElement('.video iframe[title]', document, 10000, 500);
      }
    } catch (error) {
      throw new Error('Error waiting for elements to be loaded');
    }
  },

  /**
     * Apply DOM operations to the provided document and return
     * the root element to be then transformed to Markdown.
     * @param {HTMLDocument} document The document
     * @param {string} url The url of the page imported
     * @param {string} html The raw html (the document is cleaned up during preprocessing)
     * @param {object} params Object containing some parameters given by the import process.
     * @returns {HTMLElement} The root element to be transformed
     */
  transformDOM: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
    const main = document.body;

    // extract information from the url
    const urlObj = new URL(url);
    const pageCategory = urlObj.pathname.split('/')[2];

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      '.header-parsys',
      '.footer-parsys',
      'header',
      'footer',
      '#skip-content',
      '.experiencefragment',
      '.alert-parsys',
      '.animated',
      '.banner-hero .hero-bfs__breadcrumb',
      '.animated .back-to-top__button',
      'script',
      '.search__bar',
      '.rates-and-fees__left-panel',
      '.modal',
      '.table_swipe-indicator__icon animate',
      '.table_swipe-indicator__text',
    ]);

    fixHeadings(main);

    // convert html tables in columns blocks
    main.querySelectorAll('table').forEach((table) => {
      if (table.rows.length > 0 && table.rows[0].cells.length > 0 ) {
        // get number of columns
        const nCols = Math.max(...[...table.querySelectorAll('tr')].map((tr) => tr.querySelectorAll('td, th').length));
        
        table.querySelectorAll('[rowspan]').forEach((cell) => {
          cell.removeAttribute('rowspan');
        });
        table.querySelectorAll('tr').forEach((tr) => {
          // if the row has less cells than the number of columns, add empty cells
          if (tr.cells.length < nCols) {
            for (let i = tr.cells.length; i < nCols; i++) {
              tr.innerHTML = '<td>&nbsp;</td>' + tr.innerHTML;
              // tr.insertCell();
            }
          }
        });

        // select table target where to prepend the new line
        let target = table.querySelector('tbody') || table;

        // prepend the new columns block header
        target.innerHTML = `<tr><th colspan=${nCols}>columns</th></tr>` + target.innerHTML;
      }
    });

    const h1 = document.querySelector('.hero-bfs h1');
    const searchbar = document.querySelector('.hero-bfs .search-anywhere');
    if (searchbar) {
      const search = [
        ['Search'],
        [''],
      ];
      const searchTable = WebImporter.DOMUtils.createTable(search, document);
      main.append(searchTable);

      searchTable.after(document.createElement('hr'));
    } else {
      h1.after(document.createElement('hr'));
    }
    // create the metadata block and append it to the main element

    const container = document.querySelector('.container-article, .rates-fees');
    if (container) {
      const template = document.querySelector('meta[name="template"]');

      let layoutType = 'article-short';
      if (template?.content === 'help-centre-long-article-template') {
        layoutType = 'article-long';
      }

      container.after(document.createElement('hr'));

      container.after(WebImporter.DOMUtils.createTable([
        ['section-metadata'],
        ['style', layoutType],
      ], document));
    }

    // feedback section
    const ratingContent = document.querySelector('.three-column-block .list');
    if (ratingContent) {
      // enforce heading level 3 in rating section
      ratingContent.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
        h.outerHTML = `<h3>${h.innerHTML}</h3>`;
      });

      main.append(ratingContent.cloneNode(true));
      main.append(WebImporter.DOMUtils.createTable([
        [ 'section-metadata' ],
        [ 'style', 'rating' ],
      ], document));
      main.append(document.createElement('hr'));
    }

    // bottom section - fragment
    main.append(WebImporter.DOMUtils.createTable([
      [ 'fragment' ],
      [ CATEGORY_FRAGMENT_MAP[pageCategory] ],
    ], document));


    const video = document.querySelector('.video-component');
    if (video) {
      createEmbedBlock(main, document);
    }

    const storeImages = document.querySelector('.image');
    if (storeImages) {
      setPlayIcons(main, document);
    }

    const accordion = document.querySelector('.accordion-layout');
    if (accordion) {
      createAccordion(main, document);
    }

    createMetadata(main, document);

    makeLinks(main, document);

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      'iframe',
      'noscript',
      '.three-column-block',
    ]);

    return main;
  },

  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '')),
};
