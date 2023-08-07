// ==UserScript==
// @name          X小说
// @domain        xcmfu.com
// @version       1.0.2
// @supportURL    https://github.com/open-book-source/booksource-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// @function      categories
// ==/UserScript==

async function search(keyword, opaque) {
    let page = opaque ? opaque.page : 1;
    let resp = await fetch(`https://xcmfu.com/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            "User-Agent": UserAgents.macos,
        },
        data: `searchkey=${encodeURIComponent(keyword)}`,
    });
    if (resp.status !== 200) {
        return {
            code: resp.status,
            message: 'Network error!',
        };
    }
    let doc = new Document(resp.data);
    let items = doc.querySelectorAll("#main > div.list_center > div#sitebox > dl")
    let result = [];
    for (let item of items) {
        let data = Date.parseWithFormat(item.querySelector("dd:nth-of-type(1) > h3 > span.uptime").text, "yyyy-MM-dd");
        let nameEle = item.querySelector("dd:nth-of-type(1) h3 a");
        let name = nameEle.text;
        let url = nameEle.getAttribute("href");
        let matchArray = url.match(/\/(\d+)\/(\d+).html/);
        let cateId = matchArray[1];
        let bookId = matchArray[2];
        let id = JSON.stringify({cateId: cateId, bookId: bookId})
        let author = item.querySelector("dd.book_other span:nth-of-type(1)").text
        let category = item.querySelector("dd.book_other span:nth-of-type(2)").text
        let words = item.querySelector("dd.book_other span:nth-of-type(3)").text
        let cover = item.querySelector("dt a img").getAttribute("data-original")
        let intro = item.querySelector("dd.book_des").text
        let lastChapterName = item.querySelector("dd:nth-of-type(4) a").text

        result.push({
            id: id,
            name: name,
            author: author,
            category: category,
            intro: intro,
            cover: cover,
            words: parseInt(words),
            updateTime: data, // 更新日期
            lastChapterName: lastChapterName,
            status: 0, // 状态: 0: 连载; 1: 完本; 2: 断更;
        });
    }
    return {
        data: {
            data: result,
            hasMore: false,
            opaque: opaque,
        }
    }
}

// 详情
async function detail(id) {
    let idObj = JSON.parse(id)
    let response = await fetch(`https://xcmfu.com/${idObj.cateId}/${idObj.bookId}.html`, {
        headers: {"User-Agent": UserAgents.macos},
    });
    if (response.status !== 200) {
        return {
            code: response.status,
            message: 'Network error!',
        };
    }
    let uri = Uri.parse(response.finalUrl);
    let doc = new Document(response.data);
    let name = doc.querySelector(".d_title > h1").ownText.trim();
    let author = doc.querySelector(".p_author a").text;
    let intro = doc.querySelector("#bookintro p").text.trim();
    let cover = uri.resolve(doc.querySelector("#bookimg img").getAttribute("src")).toString();
    let updateTime = Date.parseWithFormat(doc.querySelector("#uptime span").text, "yyyy-MM-dd");
    let lastChapterName = doc.querySelector("#newlist .chaw li:nth-of-type(1) a").text;
    let status = doc.querySelector("#count ul li:nth-of-type(3) span") === "连载中" ? 1 : 0;
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

// 目录
async function toc(id) {
    let idObj = JSON.parse(id)
    let response = await fetch(`https://xcmfu.com/${idObj.cateId}/${idObj.bookId}.html`, {
        headers: {"User-Agent": UserAgents.macos},
    });
    if (response.status !== 200) {
        return {
            code: response.status,
            message: 'Network error!',
        };
    }
    let uri = Uri.parse(response.finalUrl);
    let doc = new Document(response.data);
    let items = doc.querySelectorAll("#chapterList li a")
    let array = [];
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let url = item.getAttribute('href');
        array.push({
            name: item.text,
            id: JSON.stringify({
                cateId: idObj.cateId,
                bookId: idObj.bookId,
                chapterId: url.match(/\/(\d+)\/(\d+)\/(\d+).html/)[3],
            }),
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
    let response = await fetch(`https://xcmfu.com/${cidObj.cateId}/${cidObj.bookId}/${cidObj.chapterId}.html`, {
        headers: {"User-Agent": UserAgents.macos},
    });
    if (response.status !== 200) {
        return {
            code: response.status,
            message: 'Network error!',
        };
    }
    let doc = new Document(response.data);
    let html = doc.querySelector("#TextContent").innerHtml;
    return {
        data: {
            finalUrl: response.finalUrl,
            body: html,
        },
    };
}

const categories = {
    data: {
        children: [
            {key: '玄幻魔法', value: 1},
            {key: '武侠修真', value: 2},
            {key: '都市言情', value: 3},
            {key: '历史军事', value: 4},
            {key: '网游竞技', value: 5},
            {key: '科幻小说', value: 6},
            {key: '恐怖灵异', value: 7},
            {key: '其他类型', value: 8},
        ],
    },
};

async function category(categories, opaque) {
    let type = categories[0];
    let page = opaque ? opaque.page : 1;
    let response = await fetch(`https://xcmfu.com/fenlei/${type}/${page}.html`);
    if (response.status !== 200) {
        return {
            code: response.status,
            message: 'Network error!',
        };
    }
    let uri = Uri.parse(response.finalUrl);
    let document = new Document(response.data);
    let items = document.querySelectorAll("#sitebox > dl")
    let result = [];
    for (let item of items) {
        let data = Date.parseWithFormat(item.querySelector("dd:nth-of-type(1) > h3 > span.uptime").text, "yyyy-MM-dd");
        let nameEle = item.querySelector("dd:nth-of-type(1) h3 a");
        let name = nameEle.text;
        let url = nameEle.getAttribute("href");
        let matchArray = url.match(/\/(\d+)\/(\d+).html/);
        let cateId = matchArray[1];
        let bookId = matchArray[2];
        let id = JSON.stringify({cateId: cateId, bookId: bookId})
        let category = item.querySelector("dd.book_other span:nth-of-type(1)").text
        let words = item.querySelector("dd.book_other span:nth-of-type(3)").text
        let status = item.querySelector("dd.book_other span:nth-of-type(2)").text === '连载' ? 0 : 1;
        let cover = item.querySelector("dt a img").getAttribute("data-original")
        let intro = item.querySelector("dd.book_des").text
        let lastChapterName = item.querySelector("dd:nth-of-type(4) a").text

        result.push({
            id: id,
            name: name,
            category: category,
            intro: intro,
            cover: cover,
            words: parseInt(words),
            updateTime: data, // 更新日期
            lastChapterName: lastChapterName,
            status: status, // 状态: 0: 连载; 1: 完本; 2: 断更;
        });
    }
    let hasPageNum = document.querySelector("#pagelink") !== undefined
    let pageNum = hasPageNum ? document.querySelector("#pagelink strong+a").text : undefined
    pageNum = pageNum === ">>" ? undefined : pageNum
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
