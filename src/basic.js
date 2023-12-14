// basic javascript methods
const timeRegex = /^([0-9]{1,2}:)?[0-5]?[0-9]:[0-5][0-9]$/;
const minSecRegex = /^([0-5]?[0-9]):([0-5][0-9])$/;
function addLeadingZero(number) {
    return number < 10 ? "0" + number : "" + number;
}

function addTimeStr(str, arr) {
    if (str.match(timeRegex)) {
        var minsecMatch = str.match(minSecRegex)
        if (minsecMatch) {
            let min = addLeadingZero(+minsecMatch[1]);
            let sec = addLeadingZero(+minsecMatch[2]);
            arr.push(`00:${min}:${sec}`)
        } else {
            arr.push(str);
        }
    }
}

// 텍스트에서 <a> 시간 태그 추출
function extractAnchorTags(videoId, comment, timeTableCommentArray) {
    if (comment.text.indexOf(videoId) > 0) {
        const regex = /<a(?:.|\n)*?<\/a>/g;
        const matches = comment.text.match(regex);
        if (matches) {
            const times = [];
            matches.forEach(m => addTimeStr($(m).text(), times));
            timeTableCommentArray.push({ times: times, comment: comment });
        }
    }
}

// 재생중인 시간 포매팅 sec to HH:mm:ss
function getPlayingTime(time) {
    var sec_num = parseInt(time, 10);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    if (hours < 10)
        hours = '0' + hours;
    if (minutes < 10)
        minutes = '0' + minutes;
    if (seconds < 10)
        seconds = '0' + seconds;
    return hours + ':' + minutes + ':' + seconds;
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