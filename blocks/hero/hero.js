import {
  createTag,
  decorateBlock,
  loadBlock,
} from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  const title = block.querySelector('h1');
  const info = block.querySelector('h5');
  const search = block.querySelector('.search');
  const breadcrumbs = block.querySelector('.breadcrumbs');
  const picture = block.querySelector('picture');
  if (picture) {
    picture.parentElement.classList.add('hero-picture');
  } else {
    block.classList.add('hero-no-image');
  }

  const content = createTag('div', { class: 'hero-content' }, [info, title].filter((e) => e));
  const box = createTag('div', { class: 'hero-box' }, [content, search].filter((e) => e));
  const containerOuter = createTag('div', { class: 'hero-outer' }, [breadcrumbs, box].filter((e) => e));
  block.append(containerOuter);
  if (search) {
    decorateBlock(search);
    await loadBlock(search);
  }
  if (breadcrumbs) {
    decorateBlock(breadcrumbs);
    await loadBlock(breadcrumbs);
  }
}
