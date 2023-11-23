import {
  createTag,
} from '../../scripts/lib-franklin.js';

export default async function decorate(notificationBlock) {
  const icon = createTag('div', { class: 'notification alert-icon update' }, '');
  const toBeRemoved = notificationBlock.querySelector('div > div');
  const warningText = toBeRemoved.innerText;
  const contentText = createTag('p', {}, warningText);
  const content = createTag('div', { class: 'notification alert-content' }, contentText);
  const span = createTag('span', { class: 'notification sr-only' }, 'Close');
  const closeButton = createTag('a', {
    class: 'notification alert-close-button close-icon',
    href: '#',
  }, span);

  notificationBlock.removeChild(toBeRemoved);
  notificationBlock.append(icon);
  notificationBlock.append(content);
  notificationBlock.append(closeButton);

  const main = notificationBlock.parentNode.parentNode.parentNode;
  const notificationContainer = main.querySelector('.notification-container');
  const body = main.parentNode;
  const header = body.querySelector('header');
  header.parentNode.insertBefore(notificationContainer, header.nextSibling);
  notificationContainer.style.display = 'block';

  closeButton.addEventListener('click', () => {
    notificationContainer.style.display = 'none';
  });
}
