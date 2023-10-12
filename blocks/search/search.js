import { createTag, decorateIcons } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  block.innerHTML = '';
  const searchContainer = createTag(
    'div',
    { class: 'search-container'},
    `
<label for="js-search-anywhere"></label>
<input type="text" id="js-search-anywhere" class="search_input" placeholder="Search Help Centre" tabindex="-1">
<button type="button">
    <span class="icon icon-search"></span>
</button>
<div class="search_info">
    <span class="icon icon-error"></span>
    <span class="search_info_text">Input search</span>
</div>
`,
  );
  block.append(searchContainer);
  await decorateIcons(searchContainer);
}
