// ==UserScript==
// @name          衍墨轩
// @domain        ymxwx.com
// @version       1.0.0
// @supportURL    https://github.com/open-book-source/booksource-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// @function      categories
// ==/UserScript==

async function search(keyword, opaque) {
    let page = opaque ? opaque.page : "1"
    let resp = await fetch(`http://www.ymxwx.com/search.htm?keyword=${keyword}&pn=${page}`, {
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
    let document = new Document(resp.data);
    let items = document.querySelectorAll(".container > div.left > .lastest > ul > li")
    let result = [];
    for (let item of items) {
        if (item.getAttribute("class") !== null) {
            continue
        }
        let data = Date.parseWithFormat(item.querySelector("span.t").text, "yyyy-MM-dd HH:mm");
        let nameEle = item.querySelector("span.n2 a");
        let lastChapterEle = item.querySelector("span.c2 a");
        let name = nameEle.text;
        let lastChapterUrl = lastChapterEle.getAttribute("href");
        let matchArray = lastChapterUrl.match(/book\/(\d+)\/(\d+)\/(\d+).html/);
        let cateId = matchArray[1];
        let bookId = matchArray[2];
        let id = JSON.stringify({cateId: cateId, bookId: bookId})
        let author = item.querySelector("span.a2 a").text
        let category = item.querySelector("span.nt").text
        let lastChapterName = lastChapterEle.text
        result.push({
            id: id,
            name: name,
            author: author,
            category: category,
            updateTime: data, // 更新日期
            lastChapterName: lastChapterName,
            status: 0, // 状态: 0: 连载; 1: 完本; 2: 断更;
        });
    }
    let hasPageNum = document.querySelector(".container > div.left > .lastest > ul > li.pagination") !== undefined
    let pageNum = hasPageNum ? document.querySelector(".container > div.left > .lastest > ul > li.pagination > a.current+a")?.text : undefined
    return {
        data: {
            data: result,
            hasMore: pageNum !== undefined,
            opaque: {
                page: pageNum
            },
        }
    }
}

async function detail(id) {
    let idObj = JSON.parse(id)
    let response = await fetch(`http://www.ymxwx.com/text_${idObj.bookId}.html`, {
        headers: {"User-Agent": UserAgents.macos},
    });
    if (response.status !== 200) {
        return {
            code: response.status,
            message: 'Network error!',
        };
    }
    let doc = new Document(response.data);
    let infoElement = doc.querySelector(".container > div.left > .info")
    let name = infoElement.querySelector(".line h1").ownText.trim();
    let author = infoElement.querySelector("p.detail.pt20 i:nth-of-type(1)").text;
    let intro = infoElement.querySelector(".desc+p").text.trim();
    let cover = infoElement.querySelector(".cover img").getAttribute("src");
    let updateTime = Date.parseWithFormat(infoElement.querySelector(".detail:nth-of-type(2) i").text, "yyyy-MM-dd HH:mm");
    let lastChapterName = infoElement.querySelector(".detail:nth-of-type(3) i").text;
    let status = doc.querySelector("p.detail.pt20 i:nth-of-type(3)") === "连载中" ? 1 : 0;
    return {
        data: {
            id: id,
            name: name,
            author: author,
            intro: intro,
            cover: cover,
            updateTime: updateTime,
            lastChapterName: lastChapterName,
            status: status,
            opaque: undefined,
        }
    };
}

async function toc(id) {
    let idObj = JSON.parse(id)
    let response = await fetch(`http://www.ymxwx.com/book/${idObj.cateId}/${idObj.bookId}/index.html`, {
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
    let items = document.querySelectorAll(".container > .info > ul.mulu > li")
    let array = [];
    let skipItem = true
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if (item.text === "正文") {
            skipItem = false
            continue
        }
        if (skipItem) {
            continue
        }
        item = item.querySelector("a")
        let url = item.getAttribute('href');
        array.push({
            name: item.text,
            id: url.match(/\/(\d+)\/(\d+)\/(\d+).html/)[3],
            url: uri.resolve(url).toString(),
        });
    }
    return {
        data: array,
    };
}

async function chapter(bid, cid) {
    let bidObj = JSON.parse(bid)
    let response = await fetch(`http://www.ymxwx.com/book/${bidObj.cateId}/${bidObj.bookId}/${cid}.html`, {
        headers: {
            "User-Agent": UserAgents.macos,
            Cookie: `ras=${bidObj.bookId}`
        },
    });
    if (response.status !== 200) {
        return {
            code: response.status,
            message: 'Network error!',
        };
    }
    let document = new Document(response.data);
    let contentEle = document.querySelector(".chaptercontent div.content");
    let contentText = contentEle.innerHtml.replaceAll("<br>", "\n")
    contentText = contentText.replaceAll("<script type=\"text/javascript\">applyChapterSetting();</script>", "")
    return {
        data: {
            finalUrl: response.finalUrl,
            body: contentText,
        },
    };
}
const xuanhuan = "xuanhuan"
const qihuan = "qihuan"
const xiuzhen = "xiuzhen"
const dushi = "dushi"
const yanqing = "yanqing"
const lishi = "lishi"
const tongren = "tongren"
const wuxia = "wuxia"
const kehuan = "kehuan"
const youxi = "youxi"
const junshi = "junshi"
const jingji = "jingji"
const lingyi = "lingyi"
const qita = "qita"
const categories = {
    data: {
        children: [
            {key: '玄幻', value: "xuanhuan"},
            {key: '奇幻', value: "qihuan"},
            {key: '修真', value: "xiuzhen"},
            {key: '都市', value: "dushi"},
            {key: '言情', value: "yanqing"},
            {key: '历史', value: "lishi"},
            {key: '同人', value: "tongren"},
            {key: '武侠', value: "wuxia"},
            {key: '科幻', value: "kehuan"},
            {key: '游戏', value: "youxi"},
            {key: '军事', value: "junshi"},
            {key: '竞技', value: "jingji"},
            {key: '灵异', value: "lingyi"},
            {key: '其他', value: 'qita'},
        ],
    },
};

async function category(categories, opaque) {
    let type = categories[0];
    let page = opaque ? opaque.page : 1;
    let resp = await fetch(`http://www.ymxwx.com/${type}/${page}.htm`);
    if (resp.status !== 200) {
        return {
            code: resp.status,
            message: 'Network error!',
        };
    }
    let document = new Document(resp.data);
    let items = document.querySelectorAll(".container > div.left > .lastest > ul > li")
    let result = [];
    for (let item of items) {
        if (item.getAttribute("class") !== null) {
            continue
        }
        let data = Date.parseWithFormat(item.querySelector("span.t").text, "yyyy-MM-dd HH:mm");
        let nameEle = item.querySelector("span.n2 a");
        let lastChapterEle = item.querySelector("span.c2 a");
        let name = nameEle.text;
        let lastChapterUrl = lastChapterEle.getAttribute("href");
        let matchArray = lastChapterUrl.match(/book\/(\d+)\/(\d+)\/(\d+).html/);
        let cateId = matchArray[1];
        let bookId = matchArray[2];
        let id = JSON.stringify({cateId: cateId, bookId: bookId})
        let author = item.querySelector("span.a2 a").text
        let category = item.querySelector("span.nt").text
        let lastChapterName = lastChapterEle.text
        result.push({
            id: id,
            name: name,
            author: author,
            category: category,
            updateTime: data, // 更新日期
            lastChapterName: lastChapterName,
            status: 0, // 状态: 0: 连载; 1: 完本; 2: 断更;
        });
    }
    let hasPageNum = document.querySelector(".container > div.left > .lastest > ul > li.pagination") !== undefined
    let pageNum = hasPageNum ? document.querySelector(".container > div.left > .lastest > ul > li.pagination > a.current+a").text : undefined
    return {
        data: {
            data: result,
            hasMore: pageNum !== undefined,
            opaque: {
                page: pageNum
            },
        }
    }
}