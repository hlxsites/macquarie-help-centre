import { getMetadata } from '../../scripts/lib-franklin.js';

let sectionData = 1;
let isVariation = false;

function buttonClick(event) {
  const button = event.target.closest('button');
  if (button) {
    const sectionNumber = button.getAttribute('data-section');
    const subcategoryDiv = document.querySelector(`.accordion-section [data-section="${sectionNumber}"]`).parentNode.nextElementSibling;
    if (subcategoryDiv.hasAttribute('aria-hidden') && subcategoryDiv.getAttribute('aria-hidden') === 'false') {
      subcategoryDiv.setAttribute('aria-hidden', 'true');
      button.setAttribute('aria-expanded', 'false');
    } else {
      subcategoryDiv.setAttribute('aria-hidden', 'false');
      button.setAttribute('aria-expanded', 'true');
    }
  }
}

function showView(block, accordionBody, accordionHeader, isVariation) {
  const accordionSection = document.createElement('div');
  accordionSection.classList.add('accordion-section');
  const accordionSectionHeader = document.createElement('div');
  accordionSectionHeader.classList.add('accordion-header');
  const button = document.createElement('button');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('data-section', sectionData);
  button.textContent = accordionHeader;
  button.addEventListener('click', (event) => {
    buttonClick(event);
  });
  accordionSectionHeader.appendChild(button);

  accordionSection.appendChild(accordionSectionHeader);
  sectionData += 1;

  const accordionSectionSubCategoryDiv = document.createElement('div');
  accordionSectionSubCategoryDiv.classList.add('accordion-subcategory-div');
  if (!isVariation) {
    accordionBody.forEach((item) => {
      const sectionAnchor = document.createElement('div');
      sectionAnchor.classList.add('content');
      sectionAnchor.innerHTML = `
        <a href='${item.path}'>
            <span>${item.shorttitle}</span>
        </a>
        `;
      accordionSectionSubCategoryDiv.appendChild(sectionAnchor);
    });
  } else {
    accordionBody.classList.add('content');
    accordionSectionSubCategoryDiv.appendChild(accordionBody);
  }
  accordionSectionSubCategoryDiv.setAttribute('aria-hidden', 'true');
  accordionSection.appendChild(accordionSectionSubCategoryDiv);
  block.appendChild(accordionSection);
}

export default async function decorate(block) {
  isVariation = document.querySelector('.content-center') !== null ? true : false;
  if (!isVariation) {
    const pageIndex = window.siteindex.data;
    const indexPath = window.location.pathname;
    const cat = getMetadata('category');
    const subcat = getMetadata('subcategory');

    const regex = new RegExp(`^${indexPath}/([^/]+)?$`);
    const filteredUrls = pageIndex.filter((url) => regex.test(url.path));
    filteredUrls.sort((a, b) => a.shorttitle.localeCompare(b.shorttitle));

    if (cat !== '') {
      filteredUrls.forEach((item) => {
        const regex1 = new RegExp(`^${item.path}/([^/]+)?$`);

        const filteredSubCatUrls = pageIndex
        .filter((url) => regex1.test(url.path))
        .map((url) => ({
            path: url.path,
            shorttitle: url.shorttitle,
        }));
        filteredSubCatUrls.sort((a, b) => a.shorttitle.localeCompare(b.shorttitle));
        showView(block, filteredSubCatUrls, item.shorttitle);
      });
    } else if (subcat !== '') {
      const filteredSubCatUrls = filteredUrls.map((url) => ({
        path: url.path,
        shorttitle: url.shorttitle,
      }));
      filteredSubCatUrls.sort((a, b) => a.shorttitle.localeCompare(b.shorttitle));
      showView(block, filteredSubCatUrls, getMetadata('shorttitle'));
    }
  } else {
    const accordions = [...block.children];
    block.innerHTML = '';
    accordions.forEach((item) => {
      showView(block, item.children[1], item.children[0].innerHTML, isVariation);
    });
  }
}
