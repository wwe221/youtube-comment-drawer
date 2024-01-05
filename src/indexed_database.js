var ycommIndexedDB;
function setIndexedDB() {
    if (window.indexedDB) {
        let request = window.indexedDB.open("ycommIndexedDB", 1);
        request.onerror = (e) => console.error("indexedDB.onerror");
        request.onsuccess = (e) => {
            ycommIndexedDB = request.result;
            console.info("ycommIndexedDB success");
        }
        request.onupgradeneeded = (e) => {
            let db = e.target.result;
            let commentsObjectStore = db.createObjectStore("ycomm", { keyPath: "videoId" });
            commentsObjectStore.createIndex("comments", "comments", { unique: false })
            commentsObjectStore.transaction.oncomplete = (e) => {
                console.log("transaction is completed" , e);
            }
            let configStore = db.createObjectStore("config", { keyPath: "key" });            
            configStore.transaction.oncomplete = (e) => {
                console.log("transaction is completed" , e);
            }
        }
    } else {
        console.log("This browser is not supported for IndexedDB")
    }
}
setIndexedDB();

function store_comment_to_indexed(item) {
    if (ycommIndexedDB != null)
        ycommIndexedDB.transaction("ycomm", "readwrite")
        .objectStore("ycomm")
        .add(item);
}

function store_config_to_indexed(item) {
    if (ycommIndexedDB != null)
        ycommIndexedDB.transaction("config", "readwrite")
        .objectStore("config")
        .add(item);
}

function get_comment_from_indexedDB(videoId) {
    if (ycommIndexedDB != null)
        return new Promise((resolve, reject) => {
            let result;
            const transaction = ycommIndexedDB.transaction("ycomm", 'readwrite');
            transaction.oncomplete = _ => resolve(result);
            transaction.onerror = event => reject(event.target.error);
            const store = transaction.objectStore("ycomm");
            const request = store.get(videoId);
            request.onsuccess = _ => result = request.result;
        });
    else return null;
}