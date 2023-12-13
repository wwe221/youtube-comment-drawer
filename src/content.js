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

async function appendComments(videoInfo) { // 화면에 best comments 생성
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
      timeTableCommentArray.push({ times: times, comment: comment });
    }
  }
}

// YouTube player 에서 재생중인 시간을 return
function getPlayingTime(time) {
  var sec_num = parseInt(time, 10);
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);
  if (minutes < 10)
    minutes = '0' + minutes;
  if (seconds < 10)
    seconds = '0' + seconds;
  if (hours <= 0) return minutes + ':' + seconds;
  else return hours + ':' + minutes + ':' + seconds;
}

// 재생 중 시간에 맞게 toast
function setToastCheckInterval(assembledComments) {
  player = document.querySelector("video");
  if (player) {
    player.ontimeupdate = function () {
      setTimeout(() => { }, 750);
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

// 태그가 있는 댓글들을 시간별로 collect
function collectCommentsgroupBytime(timeTableComments) {
  if (timeTableComments.length > 0)
    return timeTableComments.sort((x, y) => {
      if (x.times[0].localeCompare(y.times[0]) == 0) {
        return y.comment.likes - x.comment.likes;
      } else return x.times[0].localeCompare(y.times[0]);
    }).reduce((acc, obj) => {
      obj.times.forEach(t => {
        let key = t;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(obj);
      })
      return acc;
    });
  else return {}
}

toastr.options = {
  "closeButton": true,
  "debug": false,
  "newestOnTop": true,
  "progressBar": true,
  "positionClass": "toast-top-left",
  "preventDuplicates": true,
  "onclick": null,
  "showDuration": "50",
  "hideDuration": "50",
  "timeOut": "3000",
  "extendedTimeOut": "0",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}
