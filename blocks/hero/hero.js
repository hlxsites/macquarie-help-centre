import {
  createTag,
  decorateBlock,
  loadBlock,
} from '../../scripts/lib-franklin.js';

function hasBreadcrumbs() {
  const parts = window.location.pathname.split('/').filter((p) => p);
  return parts.length > 1;
}

export default async function decorate(block) {
  const title = block.querySelector('h1');
  const info = block.querySelector('h5');
  const search = block.querySelector('.search');
  const breadcrumbs = hasBreadcrumbs() && createTag('div', { class: 'breadcrumbs' }, '');
  const picture = block.querySelector('picture');
  if (picture) {
    const pictureParent = picture.parentElement?.parentElement;
    if (pictureParent) {
      pictureParent.classList.add('hero-picture');
      window.setTimeout(() => { pictureParent.classList.add('hero-animate'); }, 1500);
    }
  } else {
    block.classList.add('hero-no-image');
  }
  if (!info) {
    block.classList.add('hero-smaller-text');
  }

  const content = createTag('div', { class: 'hero-content' }, [info, title].filter((e) => e));
  const box = createTag('div', { class: 'hero-box' }, [content, search].filter((e) => e));
  const containerOuter = createTag('div', { class: 'hero-outer' }, [box]);
  if (search) {
    decorateBlock(search);
    await loadBlock(search);
  }
  if (breadcrumbs) {
    block.append(breadcrumbs);
    decorateBlock(breadcrumbs);
    await loadBlock(breadcrumbs);
  }
  block.append(containerOuter);
}
