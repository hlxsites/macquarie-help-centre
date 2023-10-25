import { createTag, decorateIcons } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  block.innerHTML = '';
  const searchContainer = createTag(
    'div',
    { class: 'search-outer' },
    `
<label for="js-search-anywhere" class="search-label"></label>
<input type="text" id="js-search-anywhere" class="search-input" placeholder="Search Help Centre" tabindex="-1">
<button type="button" tabindex="-1" aria-label="search" class="search-button">
    <span class="icon icon-search"></span>
</button>
<div class="search-info">
    <span class="icon icon-error"></span>
    <span class="search-info-text">Input search</span>
</div>
`,
  );
  block.append(searchContainer);
  await decorateIcons(searchContainer);
}
