var API_PROCESSING = false;
const MAX_REQUEST_CNT = 10; // 최대 1000개 가져오기
const apiKey = apikey;

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

async function getCommentsByApi(videoId) { // youtube data api 를 사용해, video 의 comments 들 load  
  let result = [];
  const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads`;
  const apiQuery = `videoId=${videoId}&key=${apiKey}&part=snippet&maxResults=100`;
  let pageTokenQuery = `&pageToken=`;
  let pageTokenString = ``;
  let request_cnt = 0;
  try {
    while (request_cnt++ < MAX_REQUEST_CNT) {
      API_PROCESSING = true;
      const response = await fetch(apiUrl + "?" + apiQuery + (pageTokenString.length > 0 ? pageTokenQuery + pageTokenString : ""));
      pageTokenString = ``;
      if (!response.ok) {
        throw new Error('Failed to fetch video details');
      }
      const data = await response.json();
      result.push(...data.items)
      if (data.nextPageToken != null) {
        pageTokenString = data.nextPageToken;
      } else {
        break;
      }
    }
    API_PROCESSING = false;
    return result;
  } catch (error) {
    API_PROCESSING = false;
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

// IndexdDB 에서 가져오거나, API 를 사용해 댓글을 조회한다.
async function getComments(videoId) {
  const result_from_indexedDB = await get_from_indexedDB(videoId);
  const timeTableComments = [];
  if (result_from_indexedDB) {
    console.log("get comments from indexedDB", result_from_indexedDB)
    return result_from_indexedDB
  } else {
    const commentResponse = await getCommentsByApi(videoId);
    const commentArr = commentResponse.map(c => {
      snippet = c.snippet.topLevelComment.snippet;
      let tmp = {
        text: snippet.textDisplay,
        writer: snippet.authorDisplayName,
        likes: snippet.likeCount
      }
      extractAnchorTags(videoId, tmp, timeTableComments);
      return tmp;
    });
    commentArr.sort((a, b) => b.likes - a.likes)
    const ttc = collectCommentsgroupBytime(timeTableComments);
    const item = { videoId: videoId, comments: commentArr, timeTableComments: timeTableComments, ttc: ttc };
    add_to_indexed(item)
    return item;
  }
}

// 화면에 best comments 생성
async function appendComments(videoInfo) { 
  $("#middle-row").empty();
  $("#comment-container").remove();
  const commentArr = await getComments(videoInfo.videoId);
  const commentContainer = $('<div id="comment-container">')
    .addClass('comment-container')
    .css({
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    });
  commentArr.comments.forEach((c, idx) => {
    if (idx >= 4) return;
    const commentDiv = $('<span>')
      .addClass('style-scope ytd-comment-renderer')
      .css({
        width: '20%',
        height: '20%',
        overflow: 'hidden',
        background: 'gray',
        padding: '10px',
        marginBottom: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
      }).html(c.text + "<br>:👍: " + c.likes);
    commentContainer.append(commentDiv);
  });
  $("#above-the-fold").prepend(commentContainer);
  return commentArr;
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log(message);
  if (message.action === 'getVideoInfo') {
    const videoInfo = getVideoInfo();
    sendResponse({ videoInfo });
    if (!API_PROCESSING) {
      const result = await appendComments(videoInfo);
      console.log(result);
      // Comments 들을 append 하고 난 뒤에 notification alert.
      setToastCheckInterval(result.ttc);
      chrome.runtime.sendMessage({ action: 'showNotification', message: result.comments.length + ' Comments Appended' });
    }
  }
});

// 재생 중 시간에 맞게 toast
function setToastCheckInterval(assembledComments) {
  player = document.querySelector("video");
  var lastUpdateTime = -1;
  if (player) {
    player.ontimeupdate = function () {
      var currentTime = Math.floor(player.currentTime);
      if (currentTime !== lastUpdateTime) {
        lastUpdateTime = currentTime;
        const time = getPlayingTime(this.currentTime);
        if (assembledComments[time]) {
          console.log(assembledComments[time]);
          assembledComments[time].forEach(c => {
            toastr.info(c.comment.text + "<br>:👍:" + c.comment.likes)
          })
        }
      }
    }
  }
}