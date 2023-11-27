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

async function getComments(videoId) { // youtube data api 를 사용해, video 의 comments 들 load  
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

async function getCommentsArray(videoId) {
  const result_from_indexedDB = await get_from_indexedDB(videoId);
  const timeTableComments = [];
  if (result_from_indexedDB) {
    console.log("get comments from indexedDB", result_from_indexedDB)
    return result_from_indexedDB.comments
  } else {
    const commentResponse = await getComments(videoId);
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
    add_to_indexed({ videoId: videoId, comments: commentArr, timeTableComments: timeTableComments})
    return commentArr;
  }
}

async function appendComments(videoInfo) {
  $("#middle-row").empty();
  $("#comment-container").remove();
  const commentArr = await getCommentsArray(videoInfo.videoId);
  const commentContainer = $('<div id="comment-container">')
    .addClass('comment-container')
    .css({
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    });
  commentArr.forEach((c, idx) => {
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
      }).html(c.text + " :👍: " + c.likes);
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
      const comments = await appendComments(videoInfo);
      console.log(comments);
      // Comments 들을 append 하고 난 뒤에 notification alert.
      chrome.runtime.sendMessage({ action: 'showNotification', message: comments.length + ' Comments Appended' });
    }
  }
});

// 텍스트에서 <a> 시간 태그 추출
function extractAnchorTags(videoId, comment, timeTableCommentArray) {
  if (comment.text.indexOf(videoId) > 0) {
    const regex = /<a(?:.|\n)*?<\/a>/g;
    const matches = comment.text.match(regex);

    if (matches) {
      const times = [];
      matches.forEach(m => {
        times.push($(m).text());
      });
      timeTableCommentArray.push({times: times, comment: comment});
    }
  }
}

// YouTube player 에서 재생중인 시간을 return
function getPlayingTime() {
  $(".video-stream").ontimeupdate = function on() { // 플렝이어의 시간이 변경될 때 마다 event
    console.log(this.currentTime)
  };
  let time = $(".video-stream").currentTime
  var sec_num = parseInt(time, 10);
  var hours   = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);
  if (hours < 10)
    hours = '0' + hours;
  if (minutes < 10)
    minutes = '0' + minutes;
  if (seconds < 10)
    seconds = '0' + seconds;
  let current_time = hours + ':' + minutes + ':' + seconds;
  
  return current_time;
}