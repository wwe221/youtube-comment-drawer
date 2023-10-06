// content.js

// Function to extract video information
function getVideoInfo() {
  const titleElement = $('#title>h1');
  const videoUrl = window.location.href;
  const commentCnt = $('ytd-comments-header-renderer>#title>#count :nth-child(2)');
  const videoId = extractVideoId(videoUrl)
  const videoInfo = {
    title: titleElement ? titleElement.innerText : 'Video title not found',
    url: videoUrl,
    commentCnt: commentCnt ? commentCnt.innerText : 'comment not Found',
    videoId: videoId
  };
  return videoInfo;
}

const apiKey = apiKey;
async function getComments(videoId) { // youtube data api 를 사용해, video 의 comments 들 load
  try {
    let result = [];
    const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads`;
    const apiQuery = `videoId=${videoId}&key=${apiKey}&part=snippet&maxResults=100`;
    const response = await fetch(apiUrl + "?" + apiQuery);
    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }
    const data = await response.json();
    result.push(...data.items)
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function extractVideoId(url) {
  if (url.indexOf("watch?v=")) {
    return url.split("watch?v=")[1].substr(0, 11);
  } else {
    return null;
  }
}

async function appendComments(videoInfo) {
  const commentResponse = await getComments(videoInfo.videoId);
  const commentArr = commentResponse.map(c => {
    snippet = c.snippet.topLevelComment.snippet;
    let tmp = {
      text: snippet.textDisplay,
      writer: snippet.authorDisplayName,
      likes: snippet.likeCount
    }    
    return tmp;
  });
  commentArr.sort((a, b) => b.likes - a.likes)
  commentArr.forEach(c => {
    $("#middle-row").append("<span>" + c.text + " :: " +c.likes + " </span><br>")
  })
}

// Send the video information to the popup script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getVideoInfo') {
    const videoInfo = getVideoInfo();
    appendComments(videoInfo);
    sendResponse({ videoInfo });
  }
});
