// ==UserScript==
// @name          乐阅读
// @domain        www.22is.com
// @version       1.0.0
// @supportURL    https://github.com/open-source-scripts/book-scripts-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==

const baseUrl = 'https://www.22is.com'

async function search(keyword, opaque) {
    let resp = await fetch(`${baseUrl}/search/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        data: `searchkey=${encodeURIComponent(keyword)}&searchtype=all`
    })
    if (resp.status !== 200) {
        throw new NetworkError(resp.status);
    }
    let doc = new Document(resp.data);
    return {
        data: {
            data: doc.querySelectorAll("div.newbox ul li")?.map((item) => {
                let id = item.querySelector("a").getAttribute("href").match(/\d+/)[0];
                let authorItems = item.querySelectorAll('p.author').map((authorItem) => {
                    return authorItem.ownText
                })
                return {
                    id: id,
                    cover: item.querySelector("a img").getAttribute("src"),
                    name: item.querySelector('div.newnav h3 a:nth-child(2)').text,
                    author: item.querySelector('div.labelbox label:nth-child(1)').text,
                    category: item.querySelector('div.labelbox label:nth-child(2)').text,
                    intro: item.querySelector('ol.ellipsis_2').innerHtml,
                    updateTime: Date.parseWithFormat(item.querySelector('div.zxzj > span').text, "yyyy-MM-dd"),
                    lastChapterName: item.querySelector('div.zxzj > p > a').text,
                    status: item.querySelector('div.labelbox label:nth-child(3)').text.trim() === "连载" ? 1 : 0,
                }
            }),
            hasMore: false,
        }
    }
}

async function detail(id) {
    let resp = await fetch(`${baseUrl}/book/${id}.html`)
    if (resp.status !== 200) {
        throw new NetworkError(resp.status);
    }
    let doc = new Document(resp.data);
    let detail = doc.querySelector(".bookbox")
    return {
        data: {
            id: id,
            name: doc.querySelector(".booknav2 > h1 > a").text,
            author: detail.querySelector(".booknav2 > p > a").text,
            category: detail.querySelector(".booknav2 p:nth-child(3) a").text,
            intro: doc.querySelector(".navtxt").text,
            cover: detail.querySelector("img").getAttribute("src"),
            words: parseInt(detail.querySelector(".booknav2 p:nth-child(4)").text.split("|")[0].replace("万字", "").trim()) * 10000,
            updateTime: Date.parseWithFormat(detail.querySelector(".booknav2 p:nth-child(5)").text.replace("更新：", "").trim(), "yyyy-MM-dd"),
            lastChapterName: doc.querySelector(".catalog > h3 > a").text,
            status: detail.querySelector(".booknav2 p:nth-child(4)").text.split("|")[1].trim() === "连载" ? 0 : 1,
        }
    }
}

async function toc(id) {
    let resp = await fetch(`${baseUrl}/read/${id}/`);
    let uri = Uri.parse(resp.finalUrl);
    if (resp.status !== 200) {
        throw new NetworkError(resp.status);
    }
    let doc = new Document(resp.data);
    let chapterList = doc.querySelectorAll("#chapterList li");
    return {
        data: chapterList.map((e) => {
            let url = e.querySelector("a").getAttribute("href");
            return {
                id: url.match(/\/(\d+).html/)[1],
                name: e.querySelector("a").text,
                url: baseUrl+url,
            }
        }),
    };
}

async function chapter(bid, cid) {
    let url = `${baseUrl}/read/${bid}/${cid}.html`
    let resp = await fetch(url);
    if (resp.status !== 200) {
        throw new NetworkError(resp.status);
    }
    let doc = new Document(resp.data);
    let content = doc.querySelector(".container .mybox .txtnav");
    content.querySelectorAll("div").forEach((e)=>{
        e.remove()
    })
    content.querySelectorAll("h3").forEach((e)=>{
        e.remove()
    })
    return {
        data: {
            finalUrl: url,
            body: content.innerHtml,
        },
    }
}