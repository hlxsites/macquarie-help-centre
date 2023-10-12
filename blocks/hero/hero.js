import {
  buildBlock,
  createTag,
  decorateBlock,
  loadBlock,
} from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  const title = block.querySelector('h1');
  const info = block.querySelector('h5');

  const content = createTag('div', { class: 'hero-content' }, [info, title]);
  const searchBlock = buildBlock('search', '');
  const box = createTag('div', { class: 'hero-box' }, [content, searchBlock]);
  const containerOuter = createTag('div', { class: 'hero-outer' }, [box]);
  block.append(containerOuter);
  decorateBlock(searchBlock);
  await loadBlock(searchBlock);
}
