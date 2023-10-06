// popup.js
const apiKey = apiKey;
// Function to update the popup HTML with video information
// popup.js
async function getVideoDetails(videoId) {
    try {
        let result = [];
        let nextPageToken = null;
        const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?videoId=${videoId}&key=${apiKey}&part=snippet&maxResults=100`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch video details');
        }
        const data = await response.json();
        result.append(...data.items)        
        return result;
    } catch (error) {
        console.error(error);
        return null;
    }
}

function extractVideoId(url) {
    if (url.indexOf("watch?v=")) {
        return url.split("watch?v=")[1].substr(0,11);
    } else {
        return null;
    }
}

async function updatePopup(videoInfo) {
    const titleElement = document.getElementById('videoTitle');
    const urlElement = document.getElementById('videoUrl');
    const cntElement = document.getElementById('commentCount');
    titleElement.textContent = videoInfo.title;
    cntElement.textContent = videoInfo.commentCnt;    
    const videoId = extractVideoId(videoInfo.url)
    urlElement.textContent = videoId;
    const response = await getVideoDetails(videoId);
    console.log(response);

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
