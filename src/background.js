const sendCreateCommentMessage = (details, event) => {
  if (details.url.includes("youtube.com/watch?")) {
    chrome.tabs.sendMessage(details.tabId, { action: 'getVideoInfo', test: event });
  }
}

chrome.webNavigation.onCompleted
  .addListener((details) => sendCreateCommentMessage(details, "onCompleted"));

chrome.webNavigation.onHistoryStateUpdated
  .addListener((details) => sendCreateCommentMessage(details, "onHistory"));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showNotification') {
    const options = {
      type: 'basic',
      title: 'Comments Appended',
      message: request.message,
      iconUrl: 'icon.png',
    };

    chrome.notifications.create(options);
  }
});
