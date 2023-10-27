const CATEGORY_FRAGMENT_MAP = {
    'personal': 'https://main--macquarie-help-centre--hlxsites.hlx.live/help/fragment/experience-fragment',
    'business': 'https://main--macquarie-help-centre--hlxsites.hlx.live/help/fragment/business-fragment',
    'advisers': 'https://main--macquarie-help-centre--hlxsites.hlx.live/help/fragment/advisers-fragment',
    'brokers': 'https://main--macquarie-help-centre--hlxsites.hlx.live/help/fragment/brokers-fragment',
  };

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

    const urlEl = document.querySelector('[property="og:url"]');
    if (urlEl) {
        const url = urlEl.content;
        const urlParts = url.split('/');
        
        if (urlParts.length >= 7) {
            const thirdPart = urlParts[6];
            const subcategory = thirdPart.replace('.html', '');
            meta.subcategory = subcategory;
        }
    }
    
    const keywords = document.querySelector('[name="keywords"]');
    if (keywords) {
      meta.keywords = keywords.content;
    }

    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(block);
  
    return meta;
  };
  
  
  export default {  
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
  
      const urlObj = new URL(url);
      const pageCategory = urlObj.pathname.split('/')[2];

      // use helper method to remove header, footer, etc.
      WebImporter.DOMUtils.remove(main, [
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
  
      const accordionLayout = document.querySelector('.accordion-layout');
      if (accordionLayout) {
        const accordion = [
            ['Accordion'],
          ];
          const accTable = WebImporter.DOMUtils.createTable(accordion, document);
          main.append(accTable);
          accTable.after(document.createElement('hr'));
      }


      main.append(WebImporter.DOMUtils.createTable([
        [ 'Fragment' ],
        [ CATEGORY_FRAGMENT_MAP[pageCategory] ],
      ], document));
  
      createMetadata(main, document);
  
  
      // use helper method to remove header, footer, etc.
      WebImporter.DOMUtils.remove(main, [
        'iframe',
        'noscript',
        '.accordion-layout',
      ]);
  
      return main;
    },
  
    generateDocumentPath: ({
      // eslint-disable-next-line no-unused-vars
      document, url, html, params,
    }) => WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '')),
  };