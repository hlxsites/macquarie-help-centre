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
    </form>
    </div>`;
}

function getSearchWidget(placeholders, initialVal, searchbox, formAction) {
  const widget = getSearchWidgetHTML(placeholders, initialVal, searchbox, formAction);
  return htmlToElement(widget);
}
const filterData = (indexItem, section, searchTerm) => {
  const searchLower = searchTerm.toLowerCase();
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
  let curPage = new URLSearchParams(searchParams).get('pg');
  if (!curPage) {
    curPage = 0;
  } else {
    // convert the current page to a number
    curPage = parseInt(curPage, 10);
  }

  const searchTerm = new URLSearchParams(searchParams).get('q');
  return { searchTerm, curPage };
}

function renderSearchResult(item) {
  return `<div class="results_list_item">
            <a href="https://www.macquarie.com.au${item.path}"><h3 class="results-list-title">${item.title}</h3></a>
            <p>https://www.macquarie.com.au${item.path}</p>
            <div class="description">${item.description}</div>
          </div>`;
}

async function searchPages(placeholders, searchTerm, page, section) {
  let json;
  if (window.siteindex && window.siteindex.data) {
    json = window.siteindex.data;
  } else {
    console.error('window.siteindex or window.siteindex.data is not defined.');
  }
  const resultsPerPage = 10;
  const startResult = page * resultsPerPage;
  const result = json.filter((item) => filterData(item, section, searchTerm));
  const div = document.createElement('div');
  const curPage = result.slice(startResult, startResult + resultsPerPage);

  const resultsHtml = `
      <div class="results">
        <div class="results_list">
          ${curPage.map(((item) => renderSearchResult(item))).join('')}
        </div>
      </div>
    `;
  div.innerHTML = resultsHtml;
  const totalResults = result.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  addPagingWidget(div, page, totalPages);
  return div;
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(
  block,
  curLocation = window.location,
) {
  const { searchTerm, curPage } = getSearchParams(curLocation.search);
  const searchtext = 'Search Help Centre';
  const emptysearchtext = '';
  const placeholders = {
    searchtext,
    emptysearchtext,
  };

  let formAction;
  if (!curLocation.href.endsWith('search-results')) {
    formAction = curLocation.href + '/search-results';
  } else {
    formAction = curLocation.href;
  }
  block.innerHTML = '';
  block.append(getSearchWidget(placeholders, searchTerm, true, formAction));

  const url = new URL(curLocation.href);
  // Get the context path
  const contextPath = url.pathname;
  const section = contextPath.split('/').slice(2, 3)[0] || '';
  if (searchTerm) {
    const results = await searchPages(placeholders, searchTerm, curPage, section);
    block.append(results);
  }
  decorateIcons(block);
}
