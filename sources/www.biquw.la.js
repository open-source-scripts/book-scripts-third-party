// ==UserScript==
// @name          必去小说网
// @domain        www.biquw.la
// @version       1.0.0
// @supportURL    https://github.com/open-source-scripts/book-scripts-third-party/issues
// @icon          http://www.biquw.la/favicon.ico
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==

const baseUrl = 'http://www.biquw.la'

async function search(keyword, opaque) {
    let resp = await fetch(`${baseUrl}/modules/article/search.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: `action=login&searchkey=${encodeURIComponent(keyword)}`
    })
    if (resp.status !== 200) {
        throw new NetworkError(resp.status);
    }
    let doc = new Document(resp.data);
    return {
        data: {
            data: doc.querySelectorAll(".toplist li")?.map((item) => {
                let id = item.querySelector(".s1 a").getAttribute("href").match(/\d+/)[0];
                let authorItems = item.querySelectorAll('p.author').map((authorItem) => {
                    return authorItem.ownText
                })
                return {
                    id: id,
                    cover: `http://www.biquw.la/files/article/image/${id.substring(0, 3)}/${id}/${id}s.jpg`,
                    name: item.querySelector('.s1').text,
                    author: item.querySelector('.s3').text,
                    words: item.querySelector('.s4').text.replace("K", 0) * 1000,
                    updateTime: Date.parseWithFormat(item.querySelector(".s6"), 'yyyy-MM-dd'),
                    lastChapterName: item.querySelector('.s2').text,
                    status: item.querySelector('.s5').text === "连载中" ? 1 : 0,
                }
            }),
            hasMore: false,
        }
    }
}

async function detail(id) {
    let resp = await fetch(`${baseUrl}/book/${id}/`)
    if (resp.status !== 200) {
        throw new NetworkError(resp.status);
    }
    let doc = new Document(resp.data);
    let detail = doc.querySelector("#info");
    return {
        data: {
            id: id,
            name: detail.querySelector("h1").text,
            author: detail.querySelector(".item.red").text.trim(),
            category: doc.querySelector(".title a:nth-child(2)").text.trim(),
            intro: detail.querySelector(".bookinfo_intro").ownText,
            cover: doc.querySelector(".pic img").getAttribute("src").text,
            updateTime: Date.parseWithFormat(detail.querySelector(".options span:nth-child(2)").text.trim(), "yyyy-MM-dd HH:mm:ss"),
            lastChapterName: doc.querySelector(".update a").text,
        }
    }
}

async function toc(id) {
    let resp = await fetch(`http://www.biquw.la/book/${id}/`);
    let uri = Uri.parse(resp.finalUrl);
    if (resp.status !== 200) {
        throw new NetworkError(resp.status);;
    }
    let doc = new Document(resp.data);
    let chapterList = doc.querySelectorAll(".book_list li a");
    return {
        data: doc.querySelectorAll(".book_list li a").map((item) => {
            return {
                name: item.text,
                id: item.getAttribute("href").match(/\d+/)[0],
                url: item.getAttribute("href"),
            }
        }),
    };
}

async function chapter(bid, cid) {
    let resp = await fetch(`http://www.biquw.la/book/${bid}/${cid}.html`)
    if (resp.status !== 200) {
        throw new NetworkError(resp.status);;
    }
    let doc = new Document(resp.data);
    let content = doc.querySelector("#htmlContent").innerHtml;
    return {
        data: {
            finalUrl: resp.finalUrl,
            body: content,
        }
    }
}