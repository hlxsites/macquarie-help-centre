import { decorateIcons } from '../../scripts/lib-franklin.js';
import { addPagingWidget } from '../../scripts/scripts.js';

/**
 * Convert html in text form to document element
 * @param {string} html the html to process
 * @returns A document element
 */
function htmlToElement(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild;
}

function getSearchWidgetHTML(placeholders, initialVal, searchbox, formAction) {
  const searchType = searchbox ? 'search' : 'text';
  return `
  <div class="search-outer">
    <form method="get" class="search" action="${formAction}">
      <label for="js-search-anywhere" class="search-label"></label>
        <input type="${searchType}" name="q" value="${initialVal ?? ''}" id="js-search-anywhere" class="search-input"
          placeholder="${placeholders.searchtext}" required="true" oninput="this.setCustomValidity('')"
          oninvalid="this.setCustomValidity('${placeholders.emptysearchtext}')">
        <button type="submit" tabindex="-1" aria-label="search" class="search-button">
          <span class="icon icon-search"></span>
        </button>
      <div class="search-info">
        <span class="icon icon-error"></span>
        <span class="search-info-text">Input search</span>
      </div>
    </form>
  </div>`;
}

function getSearchWidget(placeholders, initialVal, searchbox, formAction) {
  const widget = getSearchWidgetHTML(placeholders, initialVal, searchbox, formAction);
  return htmlToElement(widget);
}
const filterData = (indexItem, section, searchTerm) => {
  const searchLower = searchTerm.toLowerCase().trim();
  return (
    indexItem.title.toLowerCase().includes(searchLower)
    || indexItem.description.toLowerCase().includes(searchLower)
    || indexItem.shorttitle.toLowerCase().includes(searchLower)
    || indexItem.category.toLowerCase().includes(searchLower)
    || indexItem.subcategory.toLowerCase().includes(searchLower)
    || (Array.isArray(indexItem.keywords)
      && indexItem.keywords.some((keyword) => keyword.toLowerCase().includes(searchLower))
    )
  ) && indexItem.section === section;
};

export function getSearchParams(searchParams) {
  let currPageItems = new URLSearchParams(searchParams).get('pg');
  if (!currPageItems) {
    currPageItems = 0;
  } else {
    // convert the current page to a number
    currPageItems = parseInt(currPageItems, 10);
  }

  const searchTerm = new URLSearchParams(searchParams).get('q');
  return { searchTerm, currPageItems };
}

function renderSearchResult(item) {
  return `<div class="results-list-item">
            <a class ="results-list_link" href="${window.location.protocol}//${window.location.host}${item.path}" target="_blank"><h3 class="results-list-title">${item.title}</h3></a>
            <p class="results-list-url">${window.location.protocol}//${window.location.host}${item.path}</p>
            <div class="results-list_description">${item.description}</div>
          </div>`;
}

async function searchPages(searchTerm, page, section, block) {
  const json = window.siteindex.data;
  const resultsPerPage = 10;
  const startResult = page * resultsPerPage;
  const result = json.filter((item) => filterData(item, section, searchTerm));
  const div = document.createElement('div');
  const currPageItems = result.slice(startResult, startResult + resultsPerPage);

  const resultsHtml = `
      <div class="results">
        <div class="results-list">
          ${currPageItems.map(((item) => renderSearchResult(item))).join('')}
        </div>
      </div>
    `;
  const errorResultHtml = `
  <div class="error-messages">
    <div class="error-message-title p3 error-message-noresults show-error">
      <img class="error-message-search-icon" src="/help/icons/icon_search_no_results_80.svg">
      <h1>No results</h1>
      <p>No results containing your search terms were found.</p>
      <p>Make sure all words are spelled correctly, try different or more general keywords.</p>  
    </div>
  </div>`;
  if (result && result.length === 0) {
    div.innerHTML = errorResultHtml;
  } else {
    div.innerHTML = resultsHtml;
    const totalResults = result.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    addPagingWidget(div, page, totalPages);
    const paginationBlock = div.querySelector('ul');
    const paginationLimit = 5;
    if (totalPages > paginationLimit) {
      let elementForward = 0;
      const threeDotsAfter = document.createElement('li');
      const ata = document.createElement('a');
      ata.innerText = '...';
      threeDotsAfter.appendChild(ata);

      const threeDotsBefore = document.createElement('li');
      const atb = document.createElement('a');
      atb.innerText = '...';
      threeDotsBefore.appendChild(atb);

      const firstElement = paginationBlock.querySelector('.prev.page').nextElementSibling;
      const lastElement = paginationBlock.querySelector('.next.page').previousElementSibling;
      firstElement.after(threeDotsBefore);
      lastElement.before(threeDotsAfter);

      if (page < (paginationLimit - 1)) {
        firstElement.nextElementSibling.classList.add('notvisible');
        const currentElement = paginationBlock.querySelector('.active');
        // eslint-disable-next-line max-len
        elementForward = (page === 0) ? currentElement.nextElementSibling.nextElementSibling.nextElementSibling : currentElement.nextElementSibling.nextElementSibling;
        while (elementForward.innerText !== '...' && elementForward) {
          elementForward.classList.add('notvisible');
          elementForward = elementForward.nextElementSibling;
          if (elementForward.innerText === '...') break;
        }
      }
      if (page > (paginationLimit - 2) && (page < (totalPages - 3))) {
        const currentElement = paginationBlock.querySelector('.active');
        elementForward = currentElement.nextElementSibling.nextElementSibling;
        while (elementForward) {
          elementForward.classList.add('notvisible');
          elementForward = elementForward.nextElementSibling;
          if (elementForward.innerText === '...') break;
        }
        // eslint-disable-next-line max-len
        let elementBefore = currentElement.previousElementSibling.previousElementSibling.previousElementSibling;
        while (elementBefore) {
          elementBefore.classList.add('notvisible');
          elementBefore = elementBefore.previousElementSibling;
          if (elementBefore.innerText === '...') break;
        }
      } else if (page > (totalPages - 4)) {
        const currentElement = paginationBlock.querySelector('.active');
        lastElement.previousElementSibling.classList.add('notvisible');
        // eslint-disable-next-line max-len
        let elementBefore = currentElement.previousElementSibling.previousElementSibling.previousElementSibling;
        while (elementBefore.innerText !== '...' && elementBefore) {
          elementBefore.classList.add('notvisible');
          elementBefore = elementBefore.previousElementSibling;
          if (elementBefore.innerText === '...') break;
        }
      }
    }
  }
  const resultsDiv = block.querySelector('.results');
  if (resultsDiv) {
    resultsDiv.parentNode.removeChild(resultsDiv);
  }
  block.append(div);
}

function buildSubmitURL(currLocation = window.location.href) {
  const categoryOptions = ['personal', 'business', 'advisers', 'brokers'];
  const url = new URL(currLocation.href);
  const contextPath = url.pathname;
  for (let i = 0; i < categoryOptions.length; i += 1) {
    const option = categoryOptions[i];
    if (contextPath.startsWith(`${window.hlx.codeBasePath}/${option}`)) {
      return `${window.location.protocol}//${window.location.host}${window.hlx.codeBasePath}/${option}/search-results`;
    }
  }
  return '';
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(
  block,
  curLocation = window.location,
) {
  const { searchTerm, currPageItems } = getSearchParams(curLocation.search);
  const searchtext = 'Search Help Centre';
  const emptysearchtext = '';
  const placeholders = {
    searchtext,
    emptysearchtext,
  };

  let formAction;
  if (!curLocation.href.endsWith('search-results')) {
    formAction = buildSubmitURL(curLocation);
  } else {
    formAction = curLocation.href;
  }
  block.innerHTML = '';
  block.append(getSearchWidget(placeholders, searchTerm, true, formAction));

  const url = new URL(curLocation.href);
  /* eslint-disable no-restricted-globals */
  history.pushState(null, null, url.toString());
  // Get the context path
  const contextPath = url.pathname;
  const section = contextPath.split('/').slice(2, 3)[0] || '';
  if (searchTerm) {
    if (window?.siteindex?.loaded) {
      await searchPages(searchTerm, currPageItems, section, block);
    } else {
      const div = document.createElement('div');
      div.classList.add('results');
      block.append(div);
      document.addEventListener('dataset-ready', () => searchPages(searchTerm, currPageItems, section, block));
    }
  }
  decorateIcons(block);
}
