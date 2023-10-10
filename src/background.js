chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.url.includes("youtube.com/watch?")) {
        chrome.tabs.sendMessage(details.tabId, { action: 'getVideoInfo' });
    }
});

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
