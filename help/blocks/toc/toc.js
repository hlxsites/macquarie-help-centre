import { createTag } from '../../scripts/lib-franklin.js';

const sections = [];

function createAnchorTagLink(tocContentWrapper, hTag) {
  const contentLinkId = hTag.getAttribute('id');
  const contentLink = hTag.textContent;
  const tagName = hTag.tagName.toLowerCase();

  // create link element
  const aLink = createTag('a', { class: 'content-link', href: `#${contentLinkId}` });
  aLink.append(contentLink);
  aLink.classList.add(tagName);
  tocContentWrapper.append(aLink);

  // add scroll listener to calculate the active link
  document.getElementsByClassName('content-link')[0].classList.add('active');
  document.getElementById(contentLinkId).classList.add('scroll-margin');
  sections.push(document.getElementById(contentLinkId));
  window.addEventListener('scroll', () => {
    const scrollAmount = window.scrollY;
    sections.forEach((element) => {
      if (scrollAmount >= ((element.offsetTop) - 130)) {
        const idName = element.getAttribute('id');
        if (idName === contentLinkId) {
          aLink.classList.add('active');
        } else {
          aLink.classList.remove('active');
        }
      }
    });
  });
}

export default function decorate(block) {
  const articleContent = document.querySelector('.article-long');
  if (!articleContent) {
    return; // no ToC if it's not a long article
  }

  const contentDivs = articleContent.querySelectorAll(':scope > div');

  const articleContentWrapper = createTag('div', { class: 'article-content-wrapper' });
  contentDivs.forEach((div) => {
    articleContentWrapper.append(div);
  });

  const articleMainWrapper = createTag('div', { class: 'article-main-wrapper' });
  articleMainWrapper.append(block);
  articleMainWrapper.append(articleContentWrapper);
  articleContent.textContent = '';
  articleContent.append(articleMainWrapper);

  const tocContentWrapper = createTag('div', { class: 'toc-content-wrapper' });
  block.textContent = '';
  block.append(tocContentWrapper);

  const headerTags = articleContentWrapper.querySelectorAll('h2, h3');
  headerTags.forEach((headerTag) => {
    createAnchorTagLink(tocContentWrapper, headerTag);
  });

  // clean up the old div
  const main = document.querySelector('main');
  const tocContainer = main.querySelector('.section.toc-container');
  main.removeChild(tocContainer);
}
