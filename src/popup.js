// popup.js

async function updatePopup(videoInfo) {
    const titleElement = document.getElementById('videoTitle');
    const urlElement = document.getElementById('videoUrl');
    const cntElement = document.getElementById('commentCount');
    titleElement.textContent = videoInfo.title;
    cntElement.textContent = videoInfo.commentCnt;
    urlElement.textContent = videoInfo.videoId;
}

// Request video information from content.js
chrome.tabs.query({
    active: true,
    currentWindow: true,
    // status: "complete"
}, (tabs) => {
    console.log(tabs);
    if (tabs[0].url.indexOf("www.youtube.com") > 0)
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getVideoInfo' }, (response) => {
            const { videoInfo } = response;
            updatePopup(videoInfo);
        });
});
