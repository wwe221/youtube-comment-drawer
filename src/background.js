let flags = { showNotification: true };

function extractVideoId(url) {
  if (url.indexOf("watch?v=")) {
    return url.split("watch?v=")[1].substr(0, 11);
  } else {
    return null;
  }
}

const sendCreateCommentMessage = (details, event) => {
  if (details.url.includes("youtube.com/watch?")) {
    let videoId = extractVideoId(details.url);
    chrome.tabs.sendMessage(details.tabId, { action: 'getVideoInfo', videoId: videoId });
  }
}

chrome.webNavigation.onCompleted
  .addListener((details) => sendCreateCommentMessage(details, "onCompleted"));

chrome.webNavigation.onHistoryStateUpdated
  .addListener((details) => sendCreateCommentMessage(details, "onHistory"));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showNotification') {
    if (flags.showNotification) {
      const options = {
        type: 'basic',
        title: 'Comments Appended',
        message: request.message,
        iconUrl: 'icon.png',
      };
      chrome.notifications.create(options);
    }
  }
  if (request.action === 'getFlags') {
    sendResponse(flags);
  }
  if (request.action === 'setFlags') {
    flags = request.flags
  }
});
