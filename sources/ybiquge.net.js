// ==UserScript==
// @name          壹笔阁
// @domain        ybiquge.net
// @version       1.0.0
// @supportURL    https://github.com/open-book-source/booksource-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==


async function search(keyword, opaque) {
    let page = opaque ? opaque.page : "1"
    let resp = await fetch(`https://www.ybiquge.net/search.php?keyword=${keyword}&page=${page}`, {
        method: 'GET',
        headers: {
            "User-Agent": UserAgents.macos,
        },
    })
    if (resp.status !== 200) {
        return {
            code: resp.status,
            message: 'Network error!',
        };
    }
    let uri = Uri.parse(resp.finalUrl)
    let document = new Document(resp.data);
    let items = document.querySelectorAll(".result-list .result-item")
    let result = [];
    for (let item of items) {
        let nameEle = item.querySelector(".result-game-item-detail .result-item-title a");
        let infoEle = item.querySelector(".result-game-item-info")
        let data = Date.parseWithFormat(item.querySelector(".result-game-item-info-tag:nth-of-type(3) span:nth-of-type(2)").text, "yyyy-MM-dd");
        let lastChapterEle = infoEle.querySelector(".result-game-item-info-tag:nth-of-type(4) a");
        let name = nameEle.text;
        let lastChapterUrl = lastChapterEle.getAttribute("href");
        let matchArray = lastChapterUrl.match(/\/(\d+)_(\d+)\/(\d+).html/);
        let cateId = matchArray[1];
        let bookId = matchArray[2];
        let id = cateId + "_" + bookId
        let author = item.querySelector(".result-game-item-info-tag:nth-of-type(1) span:nth-of-type(2)").text
        let category = item.querySelector(".result-game-item-info-tag:nth-of-type(2) span:nth-of-type(2)").text
        let intro = item.querySelector(".result-game-item-desc").text
        let lastChapterName = lastChapterEle.text
        let coverUrl = item.querySelector(".result-game-item-pic > a > img").getAttribute("src")
        result.push({
            id: id,
            name: name,
            cover: uri.resolve(coverUrl).toString(),
            author: author,
            category: category,
            intro: intro,
            updateTime: data, // 更新日期
            lastChapterName: lastChapterName,
            status: 0, // 状态: 0: 连载; 1: 完本; 2: 断更;
        });
    }
    //分页是js 动态渲染的，不想写了
    return {
        data: {
            data: result,
            hasMore: false,
        }
    }
}

async function detail(id){
    let response = await fetch(`https://www.ybiquge.net/${id}/`, {
        headers: {"User-Agent": UserAgents.macos},
    });
    if (response.status !== 200) {
        return {
            code: response.status,
            message: 'Network error!',
        };
    }
    let uri = Uri.parse(response.finalUrl);
    let document = new Document(response.data);
    let infoElement = document.querySelector(".box_con")
    let name = infoElement.querySelector("#maininfo #info h1").ownText.trim();
    let author = infoElement.querySelector("#maininfo #info p:nth-of-type(1)").text.replace("作    者：","");
    let intro = infoElement.querySelector("#maininfo #intro").text.trim();
    let cover = infoElement.querySelector("#fmimg img").getAttribute("src");
    let updateTime = Date.parseWithFormat(infoElement.querySelector("#maininfo #info p:nth-of-type(3)").text.replace("最后更新：",""), "yyyy-MM-dd HH:mm:ss");
    let lastChapterName = infoElement.querySelector("#maininfo #info p:nth-of-type(4) a").text;
    let status = document.querySelector("p.detail.pt20 i:nth-of-type(3)") === "连载中" ? 1 : 0;
    return {
        data: {
            id: id,
            name: name,
            author: author,
            intro: intro,
            cover: uri.resolve(cover).toString(),
            updateTime: updateTime,
            lastChapterName: lastChapterName,
            status: status,
            opaque: undefined,
        }
    };
}

async function toc(id){
    let response = await fetch(`https://www.ybiquge.net/${id}/`, {
        headers: {"User-Agent": UserAgents.macos},
    });
    if (response.status !== 200) {
        return {
            code: response.status,
            message: 'Network error!',
        };
    }
    let uri = Uri.parse(response.finalUrl);
    let document = new Document(response.data);
    let items = document.querySelectorAll("#list dl dd a")
    let array = [];
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let url = item.getAttribute('href');
        array.push({
            name: item.text,
            id: url.match(/\/(\d+)_(\d+)\/(\d+).html/)[3],
            url: uri.resolve(url).toString(),
        });
    }
    return {
        data: array,
    };
}

// 章节
async function chapter(bid, cid) {
    let cidObj = JSON.parse(cid)
    let response = await fetch(`https://www.ybiquge.net/${bid}/${cid}.html`, {
        headers: {"User-Agent": UserAgents.macos},
    });
    if (response.status !== 200) {
        return {
            code: response.status,
            message: 'Network error!',
        };
    }
    let doc = new Document(response.data);
    let contentText = doc.querySelector("#content").innerHtml;
    contentText = contentText.replaceAll("<br>", "\n")
    contentText = contentText.replaceAll("https://www.ybiquge.com", "")
    contentText = contentText.replaceAll("www.ybiquge.com", "")
    contentText = contentText.substring(0,contentText.indexOf("无尽的昏迷过后，时宇猛地从床上起身。"))
    return {
        data: {
            finalUrl: response.finalUrl,
            body: contentText,
        },
    };
}