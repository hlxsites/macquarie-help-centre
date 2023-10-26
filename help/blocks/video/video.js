import { createTag } from '../../scripts/lib-franklin.js';

const videoTypeMap = Object.freeze({
  youtube: [/youtube\.com/, /youtu\.be/],
});

/**
 * Determine the type of video from its href.
 * @param href
 * @return {undefined|youtube}
 */
export const getVideoType = (href) => {
  const videoEntry = Object.entries(videoTypeMap).find(
    ([, allowedUrls]) => allowedUrls.some((urlToCompare) => urlToCompare.test(href)),
  );
  if (videoEntry) {
    return videoEntry[0];
  }
  return undefined;
};

/**
 * Extract YouTube video id from its URL.
 * @param href A valid YouTube URL
 * @return {string|null}
 */
const getYouTubeId = (href) => {
  const ytExp = /(?:[?&]v=|\/embed\/|\/1\/|\/v\/|https:\/\/(?:www\.)?youtu\.be\/)([^&\n?#]+)/;
  const match = href.match(ytExp);
  if (match && match.length > 1) {
    return match[1];
  }
  return null;
};

/**
 * Decorate the video link as a play button.
 * @param link Existing video link
 * @param buttonLabel Label for the button
 * @param videoDuration Label for video duration
 * @return {HTMLElement} The new play button
 */
const decorateVideoLink = (link, buttonLabel = 'Play', videoDuration = '00:00') => {
  let playBtn = link;
  playBtn = createTag(
    'div',
    { class: 'open-video' },
    `<span class='video-button-content'>
<span class='video-button-title'>${buttonLabel}</span>
<span class='video-button-duration'>${videoDuration}</span></span>
<button class='video-button-cta' aria-label='Play video'><span class='video-button-play'></span></button>`,
  );
  link.parentElement.appendChild(playBtn);
  link.parentElement.removeChild(link);
  return playBtn;
};

const embedYoutube = (url, ariaLabel, autoplay = 1) => {
  const suffix = autoplay ? '&autoplay=1' : '';
  const vid = getYouTubeId(url.href);
  const embed = url.pathname;
  const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
        <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&enabledjsapi=1&playsinline=1${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
        allow="autoplay; encrypted-media" allowfullscreen="" scrolling="no" aria-label="${ariaLabel}" title="Content from Youtube" loading="lazy"></iframe>
      </div>`;
  return embedHTML;
};

function loadEmbed(block, videoLink, ariaLabel) {
  if (block.classList.contains('video-is-loaded')) {
    return;
  }
  const videoType = getVideoType(videoLink);
  const url = new URL(videoLink);
  if (videoType === 'youtube') {
    block.innerHTML = embedYoutube(url, ariaLabel);
    block.classList = 'block video video-is-loaded';
  }
}

export default function decorate(block) {
  // decorate thumbnail container
  const picture = block.querySelector('picture');
  if (picture) {
    const pictureContainer = picture.closest('div');
    pictureContainer.classList.add('video-image');
    pictureContainer.appendChild(picture);
  }
  // get aria label
  const heading = block.querySelector('h2');
  const ariaLabel = heading?.textContent;
  if (heading) {
    heading.parentNode.removeChild(heading);
  }
  // get video duration
  const durations = [...block.querySelectorAll('p')].filter((e) => e.textContent.match(/\d+:\d+/g));
  let videoDuration = '00:00';
  if (durations.length > 0) {
    videoDuration = durations[0].textContent;
    durations[0].parentNode.removeChild(durations[0]);
  }

  // decorate video link
  const videoLink = block.querySelector('.video-image a');
  const videoText = videoLink.textContent;
  let videoHref;
  if (videoLink) {
    videoHref = videoLink.href;
    decorateVideoLink(videoLink, videoText, videoDuration);
    block.addEventListener('click', () => loadEmbed(block, videoHref, ariaLabel));
  }
}
