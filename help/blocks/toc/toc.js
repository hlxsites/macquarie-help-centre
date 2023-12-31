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
  document.getElementsByClassName('content-link')[0].closest('.first-level')?.classList.add('active');

  document.getElementById(contentLinkId).classList.add('scroll-margin');
  sections.push(document.getElementById(contentLinkId));

  window.addEventListener('scroll', () => {
    const scrollAmount = window.scrollY;
    sections.forEach((element) => {
      if (scrollAmount >= ((element.offsetTop) - 130)) {
        const idName = element.getAttribute('id');
        if (idName === contentLinkId) {
          aLink.classList.add('active');
          tocContentWrapper.classList.add('active');
          tocContentWrapper.closest('.first-level')?.classList.add('active');
        } else {
          aLink.classList.remove('active');
          tocContentWrapper.classList.remove('active');

          // remove active class from parent only if no child is active
          const firstLevelParent = tocContentWrapper.closest('.first-level');
          if (firstLevelParent && !firstLevelParent.querySelector('.active')) {
            tocContentWrapper.closest('.first-level')?.classList.remove('active');
          }
        }
      }
    });
  });
}

function getOrCreateTag(container, tagName) {
  const existingTag = container.querySelector(tagName);
  if (existingTag) {
    return existingTag;
  }
  const newTag = document.createElement(tagName);
  container.append(newTag);
  return newTag;
}

function createNestedAnchorTagLinks(content, toc) {
  const headings = content.querySelectorAll('h2, h3');
  const nestedList = document.createElement('ul');
  toc.append(nestedList);
  let lastTopLi = null;

  headings.forEach((heading) => {
    const tagName = heading.tagName.toLowerCase();
    if (tagName === 'h2') {
      const li = document.createElement('li');
      li.setAttribute('class', 'first-level');
      nestedList.append(li);
      createAnchorTagLink(li, heading);
      lastTopLi = li;
    } else if (tagName === 'h3') {
      // handle articles starting directly with H3
      if (!lastTopLi) {
        const topLi = document.createElement('li');
        topLi.setAttribute('class', 'first-level');
        nestedList.append(topLi);
        lastTopLi = topLi;
      }

      const li = document.createElement('li');
      li.setAttribute('class', 'second-level');
      const ul = getOrCreateTag(lastTopLi, 'ul');
      ul.append(li);
      createAnchorTagLink(li, heading);
    }
  });
}

export default function decorate(block) {
  const articleContent = document.querySelector('.article-long');
  if (!articleContent) {
    return; // no ToC if it's not a long article
  }

  // move article content into a wrapper
  const contentDivs = articleContent.querySelectorAll(':scope > div');
  const articleContentWrapper = createTag('div', { class: 'article-content-wrapper' });
  contentDivs.forEach((div) => {
    articleContentWrapper.append(div);
  });

  // article-main-wrapper contains two wrappers: ToC and content
  const articleMainWrapper = createTag('div', { class: 'article-main-wrapper' });
  articleMainWrapper.append(block);
  articleMainWrapper.append(articleContentWrapper);
  articleContent.textContent = '';
  articleContent.append(articleMainWrapper);

  const tocContentWrapper = createTag('div', { class: 'toc-content-wrapper' });
  block.textContent = '';
  block.append(tocContentWrapper);

  createNestedAnchorTagLinks(articleContentWrapper, tocContentWrapper);

  // clean up the old div
  const main = document.querySelector('main');
  const tocContainer = main.querySelector('.section.toc-container');
  main.removeChild(tocContainer);
}
