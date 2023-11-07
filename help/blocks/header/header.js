import { getMetadata, decorateIcons } from '../../scripts/lib-franklin.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (expanded) {
    nav.parentElement.classList.add('collapsed');
    nav.parentElement.classList.remove('expanded');
  } else {
    nav.parentElement.classList.add('expanded');
    nav.parentElement.classList.remove('collapsed');
  }
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  // explicitly setting aria-expanded to 'false' for desktop view to avoid transition
  if (isDesktop.matches) {
    nav.setAttribute('aria-expanded', 'false');
    nav.parentElement.classList.add('collapsed');
    nav.parentElement.classList.remove('expanded');
  }
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('role');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * Create a skip to main link
 */
function addSkipToMain() {
  const headerWrapper = document.querySelector('.header-wrapper');
  // create and insert skip link before header
  const skipLink = document.createElement('a');
  skipLink.href = '#main';
  skipLink.className = 'skip-link';
  skipLink.innerText = 'Skip to content';
  document.body.insertBefore(skipLink, headerWrapper);
  // add id to main element to support skip link
  const main = document.querySelector('main');
  main.id = 'main';
}

function addSectionHeaderToSection() {
  const sectionList = document.querySelectorAll('.nav-sections > ul');
  const sectionHeader = document.createElement('li');
  sectionHeader.textContent = getMetadata('shorttitle');
  sectionHeader.classList.add('mobile-section-heading');
  sectionList.forEach((ulElement) => {
    ulElement.insertBefore(sectionHeader.cloneNode(true), ulElement.firstChild);
  });
}

function updateHelpCentreLink() {
  const currentURL = new URL(window.location.href).pathname;
  const helpCentreURL = document.querySelector('.nav-brand p:nth-child(2) a:first-child');
  if (currentURL.startsWith('/help/business')) {
    helpCentreURL.href = '/help/business';
  } else if (currentURL.startsWith('/help/advisers')) {
    helpCentreURL.href = '/help/advisers';
  } else if (currentURL.startsWith('/help/brokers')) {
    helpCentreURL.href = '/help/brokers';
  }
}

function setAriaLabelToBrand(section, labels) {
  let i = 0;
  Array.from(section.children).forEach((brand) => {
    const anchorEle = brand.querySelector('p a');
    anchorEle.setAttribute('aria-label', labels[i]);
    i += 1;
  });
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // remove empty div
  block.children[0].remove();
  // fetch nav content
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta).pathname : '/nav';
  const resp = await fetch(`${window.hlx.codeBasePath}${navPath}.plain.html`);

  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.id = 'nav';
    nav.innerHTML = html;

    const classes = ['brand', 'sections', 'tools'];
    classes.forEach((c, i) => {
      const section = nav.children[i];
      // accessibility fix
      if (c === 'brand') {
        const brandLabels = ['Macquarie Bank', 'Help Centre'];
        setAriaLabelToBrand(section, brandLabels);
      }
      if (section) section.classList.add(`nav-${c}`);
    });

    const navSections = nav.querySelector('.nav-sections');
    if (navSections) {
      const currentPageURL = new URL(window.location.href);

      navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
        const sectionLink = navSection.querySelector('a');
        if (!sectionLink) return;

        const sectionURL = new URL(sectionLink.href);

        if (currentPageURL.href.startsWith(sectionURL.href)) {
          navSection.classList.add('active');
        }

        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        navSection.addEventListener('click', () => {
          if (isDesktop.matches) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      });
    }

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>`;
    hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
    nav.prepend(hamburger);
    nav.setAttribute('aria-expanded', 'false');

    decorateIcons(nav);
    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.append(nav);
    block.append(navWrapper);

    // prevent mobile nav behavior on window resize
    toggleMenu(nav, navSections, isDesktop.matches);
    isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));
  }

  // update help centre link
  updateHelpCentreLink();

  // adding section header for nav-sections
  addSectionHeaderToSection();

  // Add skip link
  addSkipToMain();
}
