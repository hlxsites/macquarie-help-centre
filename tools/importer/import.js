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
    const theme1 = 'short-article';
    meta.theme = theme1;
  } else if (theme && theme.content === 'help-centre-long-article-template') {
    const theme2 = 'long-article';
    meta.theme = theme2;
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
      if (a.href.includes('youtube') || a.href.includes('google') || a.href.includes('apple')) {
        return;
      }

      if (a.href.startsWith('/help')) {
        u = new URL(a.href, 'https://main--macquarie-help-centre--hlxsites.hlx.page/');
      } else if (a.href.startsWith('/assets')) {
        u = new URL(a.href, 'https://www.macquarie.com.au/');
      } else if (a.href.startsWith('/')) {
        u = new URL(a.href, 'https://www.macquarie.com.au/');
      } else {
        u = new URL(a.href);
        u.hostname = 'main--macquarie-help-centre--hlxsites.hlx.page';
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
    const data = [['Embed']];
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

      a.href = videoSrc;
      a.textContent = a.href;
      p.append(a);

      const pTitle = document.createElement('p');
      const strong = pTitle.appendChild(document.createElement('strong'));
      strong.textContent = title;

      pars.push(p);
      pars.push(pTitle);
    }

    const videoDesc = module.querySelector('.video__details .video__description');
    if (videoDesc) {
      const pDesc = document.createElement('p');
      pDesc.textContent = videoDesc.textContent;
      pars.push(pDesc);
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

function createTableBlock(main, document) {
  main.querySelectorAll('table').forEach((module) => {
    const data = [['Table']];
    const pars = [];
    const tablebody = document.querySelector('tbody');
    if (tablebody) {
      pars.push(tablebody);
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
  main.querySelectorAll('.image').forEach((module) => {
    // iframe tag
    const video = module.querySelector('a.cmp-image__link');
    if (video) {
      const iconLink = document.createElement('a');
      iconLink.href = video.getAttribute('href');
      if (iconLink.href.includes('google')) {
        iconLink.textContent = ':google-play-icon:';
      } else if (iconLink.href.includes('apple')) {
        iconLink.textContent = ':app-store-logo:';
      }

      // Append the icon link to the module
      module.appendChild(iconLink);
    }
  });
}

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

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
      '#skip-content',
      '.experiencefragment',
      '.alert-parsys',
      '.animated',
      '.banner-hero .hero-bfs__breadcrumb',
      '.three-column-block',
      '.animated .back-to-top__button',
      'script',
      '.search__bar',
      '.rates-and-fees__left-panel',
    ]);

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

    const container = document.querySelector('.container-article');
    if (container) {
      const tablee = document.querySelector('table');
      if (tablee) {
        createTableBlock(main, document);
      }
      container.after(document.createElement('hr'));
    }

    const ratesFees = document.querySelector('.rates-fees');
    if (ratesFees) {
      const tablee = document.querySelector('table');
      if (tablee) {
        createTableBlock(main, document);
      }
      ratesFees.after(document.createElement('hr'));
    }

    const cells = [
      ['Fragment'],
      ['https://main--macquarie-help-centre--hlxsites.hlx.live/fragment/rating-section']
    ];
    const table = WebImporter.DOMUtils.createTable(cells, document);
    main.append(table);

    table.after(document.createElement('hr'));

    const cells1 = [
      ['Fragment'],
      ['https://main--macquarie-help-centre--hlxsites.hlx.live/fragment/experience-fragment'],
    ];
    const table1 = WebImporter.DOMUtils.createTable(cells1, document);
    main.append(table1);


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
    ]);

    return main;
  },

  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '')),
};
