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

let player;

/**
 * Create a new YT Player and store the result of its player ready event.
 * @param element iFrame element YouTube player will be attached to.
 * @param videoId The YouTube video id
 */
const loadYouTubePlayer = (element, videoId) => {
  // The API will call this function when the video player is ready.
  const onPlayerReady = (event) => {
    event.target.playVideo();
  };

  // eslint-disable-next-line no-new
  player = new window.YT.Player(element, {
    videoId,
    playerVars: {
      start: 0, // Always start from the beginning
      playsinline: 1,
      enablejsapi: 1,
      rel: 0,
    },
    events: {
      onReady: onPlayerReady,
    },
  });
};

/**
 * Toggle video overlay modal between open and closed.
 * When the overlay is opened the video will start playing.
 * When the overlay is closed the video will be paused.
 * @param event the click event
 * @param block Block containing a video modal
 * @param ariaLabel Accessibility label
 */
export const toggleVideoOverlay = (event, block, ariaLabel) => {
  const modal = block.querySelector('.video-modal');
  const videoContent = modal.querySelector('.video-modal-content');
  const videoClose = modal.querySelector('.video-modal-close');
  const videoType = videoContent.getAttribute('data-videoType');
  const videoId = videoContent.getAttribute('data-videoId');
  event.stopImmediatePropagation();

  if (modal?.classList?.contains('open')) {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    if (videoType === 'youtube') {
      player?.stopVideo();
      // Destroy the iframe when the video is closed.
      const iFrame = document.getElementById(`ytFrame-${videoId}`);
      if (iFrame) {
        const container = iFrame.parentElement;
        container.removeChild(iFrame);
      }
    } else {
      modal.querySelector('video')?.pause();
      modal.querySelector('video').currentTime = 0;
    }
  } else {
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    videoClose.focus();
    if (videoType === 'youtube') {
      // Create a YouTube compatible iFrame
      videoContent.innerHTML = `<div id="ytFrame-${videoId}" aria-label="${ariaLabel}"></div>`;
      if (window.YT) {
        loadYouTubePlayer(`ytFrame-${videoId}`, videoId);
      } else {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        // eslint-disable-next-line func-names
        window.onYouTubePlayerAPIReady = function () {
          loadYouTubePlayer(`ytFrame-${videoId}`, videoId);
        };
      }
    } else {
      modal.querySelector('video')?.play();
    }
  }
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

/**
 * Display video within a modal overlay. Video can be served directly or via YouTube.
 * @param href
 * @return {HTMLElement}
 */
export const buildVideoModal = (href) => {
  const videoContent = createTag('div', { class: 'video-modal-content' }, '');
  const videoId = getYouTubeId(href);
  videoContent.dataset.ytid = videoId;
  videoContent.setAttribute('data-videoType', 'youtube');
  videoContent.setAttribute('data-videoId', videoId);

  const videoClose = createTag('button', { class: 'video-modal-close', 'aria-label': 'Close dialog' }, '');

  const videoContainer = createTag('div', { class: 'video-modal-container' }, [videoClose, videoContent]);
  const videoWrapper = createTag('div', { class: 'video-modal-wrapper' }, [videoContainer]);

  return createTag('div', { class: 'video-modal', 'aria-modal': 'true', role: 'dialog' }, [videoWrapper]);
};

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
    const videoType = getVideoType(videoHref);
    decorateVideoLink(videoLink, videoText, videoDuration);
    if (videoType === 'youtube') {
      const videoModal = buildVideoModal(videoHref);
      const videoClose = videoModal.querySelector('button.video-modal-close');
      videoClose.addEventListener('click', (e) => toggleVideoOverlay(e, block, ariaLabel));
      block.append(videoModal);

      // Display video overlay when play button is pressed
      block.addEventListener('click', (e) => toggleVideoOverlay(e, block, ariaLabel));

      // Toggle video if pressed outside video
      videoModal.addEventListener('click', (e) => toggleVideoOverlay(e, block, ariaLabel));
      videoModal.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          toggleVideoOverlay(event, block, ariaLabel);
        }
      });
    }
  }
}
