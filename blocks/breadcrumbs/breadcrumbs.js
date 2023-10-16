import ffetch from '../../scripts/ffetch.js';
import { createTag } from '../../scripts/lib-franklin.js';

function prependSlash(path) {
  return path.startsWith('/') ? path : `/${path}`;
}

function getName(pageIndex, path) {
  const pg = pageIndex.find((page) => page.path === path);
  return pg && pg.shorttitle;
}

export async function loadBreadbcrumbs() {
  const block = document.querySelector('.breadcrumbs');
  if (!block) {
    return;
  }
  const breadcrumbs = [];
  const path = window.location.pathname;
  const pathSplit = path.split('/');
  const pageIndex = await ffetch('/query-index.json').all();
  const urlForIndex = (index) => prependSlash(pathSplit.slice(1, index + 2)
    .join('/'));

  breadcrumbs.push(
    ...pathSplit.slice(1, -1)
      .map((part, index) => {
        const url = urlForIndex(index);
        return {
          name: getName(pageIndex, url),
          url_path: url,
        };
      }),
  );

  const ol = createTag('ol', {}, '');
  const liItems = breadcrumbs
    .filter((crumb) => crumb)
    .map((crumb) => createTag(
      'li',
      {},
      `<a itemprop="item" href='${crumb.url_path}'><span itemprop="name">${crumb.name}</span></a>`,
    ));
  ol.append(...liItems);
  block.replaceChildren(ol);
}

// eslint-disable-next-line no-empty-function
export default async function decorate(block) {
  const ol = createTag('ol', { class: 'breadcrumbs-hidden' }, '<li>/</li>');
  block.append(ol);
}
