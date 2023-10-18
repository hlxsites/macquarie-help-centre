import { createTag } from '../../scripts/lib-franklin.js';

function prependSlash(path) {
  return path.startsWith('/') ? path : `/${path}`;
}

function getName(pageIndex, path) {
  const pg = pageIndex.find((page) => page.path === path);
  return pg && pg.shorttitle;
}

export async function renderBreadcrumbs(block) {
  if (!block) {
    return;
  }
  const breadcrumbs = [];
  const path = window.location.pathname;
  const pathSplit = path.split('/');
  const pageIndex = window.siteindex.data;
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
  if (window?.siteindex?.loaded) {
    await renderBreadcrumbs(block);
  } else {
    const ol = createTag('ol', { class: 'breadcrumbs-hidden' }, '<li>/</li><li>/</li>');
    block.append(ol);
    document.addEventListener('siteindex-ready', () => renderBreadcrumbs(block));
  }
}
