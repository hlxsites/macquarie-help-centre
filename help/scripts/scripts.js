import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
  readBlockConfig,
} from './lib-franklin.js';

const LCP_BLOCKS = ['hero']; // add your LCP blocks to the list

window.hlx.codeBasePath = '/help';

/**
 * Extracts section metadata (for all sections) from a container element.
 * @param {Element} main The container element
 * @returns {Array} An array of section metadata objects
 */
function getSectionMetadata(main) {
  const allSectionMeta = main.querySelectorAll('div.section-metadata');
  return [...allSectionMeta].map((sectionMeta) => {
    const meta = readBlockConfig(sectionMeta);
    return meta;
  });
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const firstSection = main.querySelector(':scope > div:first-child');
  const h1 = firstSection.querySelector(':scope > h1');
  const h5 = firstSection.querySelector(':scope > h5');
  const picture = firstSection.querySelector(':scope picture');
  const search = firstSection.querySelector(':scope > .search');
  const heroElements = [];
  let heroType = '';
  if (h1) {
    const section = document.createElement('div');
    if (picture) {
      // eslint-disable-next-line no-bitwise
      if (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_FOLLOWING) {
        heroType = 'hero-img-right';
      } else {
        heroType = 'hero-img-bg';
      }
      heroElements.push(picture);
    }
    if (h5) {
      heroElements.push(h5);
    }
    heroElements.push(h1);
    if (search) {
      heroElements.push(search);
    }
    section.append(buildBlock('hero', { elems: heroElements }));
    main.prepend(section);
    const heroBlock = main.querySelector('.hero');
    if (heroType) {
      heroBlock.classList.add(heroType);
    }
    firstSection.parentElement.removeChild(firstSection);
  }
}

/**
 *  Auto block Table of Contents for article-long sections
 */
function buildTocBlock(main) {
  // check that the main has an 'article-long' section
  const sectionMeta = getSectionMetadata(main);
  if (sectionMeta.filter((meta) => meta.style === 'article-long').length > 0) {
    const section = document.createElement('div');
    section.append(buildBlock('toc', {
      elems: [],
    }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
    buildTocBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function isLinkInTableCell(link) {
  let parent = link.parentElement;
  while (parent) {
    if (parent.classList.contains('columns')) {
      const span = link.querySelector('span.external-link-icon');
      if (span) {
        span.classList.remove('external-link-icon');
      }
      return true; // Link is in column
    }
    parent = parent.parentElement;
  }
  return false; // Link is not in column
}

function isPartOfContinuousLine(linkElement) {
  // Check the previous and next siblings of the link element
  const { prevSibling } = linkElement;
  const { nextSibling } = linkElement;

  // Check if there is non-whitespace text before or after the link text
  const hasTextBefore = prevSibling && prevSibling.nodeType === Node.TEXT_NODE && prevSibling.textContent.trim() !== '';
  const hasTextAfter = nextSibling && nextSibling.nodeType === Node.TEXT_NODE && nextSibling.textContent.trim().replace(/\.$/, '') !== '';

  // If there is text before or after, it's part of a continuous line
  return hasTextBefore && hasTextAfter;
}

function decorateExternalLinks(main) {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    const title = a.getAttribute('title');
    const isPdfLink = href.includes('pdf');
    const itunes = href.includes('itunes');
    const gplay = href.includes('google');

    if (href.startsWith('http://') || href.startsWith('https://')) {
      if (!itunes && !gplay && !(title === 'Quick exit') && !isPdfLink) {
        a.setAttribute('target', '_blank');
        if ((!itunes && !gplay) && !isLinkInTableCell(a)) {
          const linkText = a.innerHTML;
          a.innerHTML = '';
          const textIconContainer = document.createElement('span');
          textIconContainer.classList.add('external-link-icon');

          textIconContainer.appendChild(document.createTextNode(linkText));
          a.appendChild(textIconContainer);
        }
      }
    }
  });
}

function decoratePdfLinks(main) {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    const isPdfLink = href.includes('pdf');
    if (isPdfLink) {
      const textIconContainer = document.createElement('span');
      const linkText = a.textContent;
      textIconContainer.textContent = linkText;
      a.textContent = '';
      if (!isPartOfContinuousLine(a)) {
        textIconContainer.classList.add('pdf-icon');
      }
      a.appendChild(textIconContainer);
    }
  });
}

function decorateSvgIconImages(main) {
  const anchorElements = main.querySelectorAll('a');

  anchorElements.forEach((anchor) => {
    if (anchor.getAttribute('href').includes('play.google.com') || anchor.getAttribute('href').includes('itunes')) {
      anchor.setAttribute('target', '_blank');
      const parentParagraph = anchor.parentElement;
      if (parentParagraph && parentParagraph.tagName === 'P') {
        parentParagraph.classList.add('svg');
        anchor.classList.add('icon-link');
      }
    }
  });
}
/**
 * Add a paging widget to the div. The paging widget looks like this:
 * <pre><code>
 * &lt; 1 2 3 &gt;
 * </code></pre>
 * The numbers are hyperlinks to the respective pages and the &lt; and &gt;
 * buttons are links to next and previous pages. If this is the first page
 * then the &lt; link has the style 'disabled' and if this is the lase one
 * the &gt; link is disabled.
 * @param {HTMLElement} div - The div to add the widget to
 * @param {number} curpage - The current page number (starting at 0)
 * @param {number} totalPages - The total number of pages
 * @param {Document} doc - The current Document
 * @param {Location} curLocation - THe current window.location to use
 */
export function addPagingWidget(
  div,
  curpage,
  totalPages,
  doc = document,
  curLocation = window.location,
) {
  const queryParams = new URLSearchParams(curLocation.search);
  const nav = doc.createElement('ul');
  nav.classList.add('pagination');

  if (totalPages > 1) {
    const lt = doc.createElement('li');
    lt.classList.add('page');
    lt.classList.add('prev');
    const lta = doc.createElement('a');
    if (curpage === 0) {
      lt.classList.add('disabled');
    } else {
      queryParams.set('pg', curpage - 1);
      lta.href = `${curLocation.pathname}?${queryParams}`;
    }
    lt.appendChild(lta);
    nav.appendChild(lt);

    for (let i = 0; i < totalPages; i += 1) {
      const numli = doc.createElement('li');
      if (i === curpage) {
        numli.classList.add('active');
      }

      const a = doc.createElement('a');
      a.innerText = i + 1;

      queryParams.set('pg', i);
      a.href = `${curLocation.pathname}?${queryParams}`;
      numli.appendChild(a);

      nav.appendChild(numli);
    }

    const rt = doc.createElement('li');
    rt.classList.add('page');
    rt.classList.add('next');
    const rta = doc.createElement('a');
    if (curpage === totalPages - 1) {
      rt.classList.add('disabled');
    } else {
      queryParams.set('pg', curpage + 1);
      rta.href = `${curLocation.pathname}?${queryParams}`;
    }

    rt.appendChild(rta);
    nav.appendChild(rt);
  }

  div.appendChild(nav);
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateExternalLinks(main);
  decoratePdfLinks(main);
  decorateSvgIconImages(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

function loadSiteIndex() {
  window.siteindex = window.siteindex || { data: [], loaded: false };
  const limit = 30000;
  const offset = 0;

  fetch(`/help/query-index.json?limit=${limit}&offset=${offset}`)
    .then((response) => response.json())
    .then((responseJson) => {
      window.siteindex.data = responseJson?.data;
      window.siteindex.loaded = true;
      const event = new Event('dataset-ready');
      document.dispatchEvent(event);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.log(`Error loading query index: ${error.message}`);
    });
}

async function loadPage() {
  loadSiteIndex();
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
