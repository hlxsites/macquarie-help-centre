import {
  createTag,
} from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  const notification = block.querySelector('.notification');
  const child = notification.querySelector(':nth-child(1)');
  const warningText = child.querySelector(':nth-child(1)').innerText;
  const toBeRemoved = notification.parentNode.parentNode;
  const notificationBlock = toBeRemoved.parentNode;

  const icon = createTag('div', { class: 'notification alert-icon update' }, '');
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

  const main = block.parentNode.parentNode.parentNode;
  const notificationContainer = main.querySelector('.notification-container');
  const body = main.parentNode;
  const header = body.querySelector('header');
  header.parentNode.insertBefore(notificationContainer, header.nextSibling);
  notificationContainer.style.display = 'block';

  closeButton.addEventListener('click', () => {
    notificationContainer.style.display = 'none';
  });
}
