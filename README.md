# youtube-comment-drawer

## 설명
chrome.webNavigation의 onCompleted 및 onHistory 이벤트가 발생하면(페이지 Load 완료 또는 뒤로/앞으로 가기 사용 시), 해당 Extension은 댓글을 가져오기 위한 동작을 수행합니다.

1. IndexedDB에 이미 저장된 댓글이 있다면, 해당 데이터를 조회하고 저장되어 있지 않다면, Youtube Data API를 호출합니다.
`(API 호출은 1회에 최대 100개의 결과를 반환하며, API 사용량을 줄이기 위해 영상당 최대 10회까지로 제한하였습니다. 만약 응답에 nextPageToken이 포함되어 있다면, 다음 호출에 사용하기 위해 이를 저장합니다.
nextPageToken이 없거나 최대 호출 횟수를 초과할 때까지 댓글을 조회하여 결과를 생성합니다.)`

2. API 호출 결과인 result를 적절한 데이터 형식으로 Formatting 합니다.

- 응답에서 댓글을 추출하여 comments = {댓글, 작성자, 좋아요 수}로 저장합니다.
- 전체 댓글을 좋아요 순으로 정렬합니다.
- 댓글에 시간 태그가 있는 경우, 정규식을 사용하여 이를 판별하고 TimeTableComment 배열에 저장합니다.
- TimeTableComment 배열을 정렬하고 가공하여, Map[HH:mm:ss] = [...comments] 형식으로 Map 데이터에 저장합니다. 
- 여러 시간을 태그한 댓글이 있는 경우, 모든 시간의 배열에 추가됩니다.
- 모든 정보를 IndexedDB에 저장합니다. (key: videoId)

3. 영상의 하단에는 좋아요 TOP 4 댓글이 표시됩니다.
4. 또한, 영상이 재생되고 있는 경우 toast.js를 활용하여 영상의 각 초마다 태그된 댓글이 있다면, 영상의 좌측에 토스트 메시지를 띄워 댓글을 쉽게 확인할 수 있도록 합니다. `(영상 재생시 video 태그의 ontimeupdate 는 약 0.25초 마다 발생하는것 같아 validation을 통해 각 초 마다 한번씩만 발생하도록 제한하였습니다.)`

