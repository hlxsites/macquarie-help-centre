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
} from './lib-franklin.js';
import ffetch from './ffetch.js';

const LCP_BLOCKS = ['hero']; // add your LCP blocks to the list

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector(':scope > div:first-child > h1');
  const h5 = main.querySelector(':scope > div:first-child > h5');
  const picture = main.querySelector(':scope > div:first-child picture');
  const search = main.querySelector(':scope > div:first-child > .search');
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
    heroBlock.classList.add(heroType);
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
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
  ffetch('/query-index.json')
    .all()
    .then((responseJson) => {
      window.siteindex.data = responseJson;
      window.siteindex.loaded = true;
      const event = new Event('siteindex-ready');
      document.dispatchEvent(event);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.log(`Error loading site index: ${error.message}`);
    });
}

async function loadPage() {
  loadSiteIndex();
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
