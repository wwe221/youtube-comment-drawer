// content.js


function getTopComments() {    
    const commentElements = document.querySelector('ytd-comments #contents').childNodes;
    const topComments = [];
  
    for (let i = 0; i < Math.min(10, commentElements.length); i++) {
      const commentElement = commentElements[i];
      const commentText = commentElement.querySelector('.style-scope yt-formatted-string').textContent.trim();
      topComments.push(commentText);
    }
  
    return topComments;
  }

// Function to extract video information
function getVideoInfo() {
    const titleElement = document.querySelector('#title>h1');
    const videoUrl = window.location.href;
    const commentCnt = document.querySelector('ytd-comments-header-renderer>#title>#count :nth-child(2)');
    const videoInfo = {
      title: titleElement ? titleElement.textContent.trim() : 'Video title not found',
      url: videoUrl,
      commentCnt: commentCnt ? commentCnt.textContent.trim() : 'comment not Found'      
    };
    return videoInfo;
  }
  
  // Send the video information to the popup script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getVideoInfo') {
      const videoInfo = getVideoInfo();
      sendResponse({ videoInfo });
    }
  });
  