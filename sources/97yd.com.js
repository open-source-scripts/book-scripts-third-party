// ==UserScript==
// @name          必看悦读
// @domain        97yd.com
// @version       1.0.1
// @supportUrl    https://github.com/open-book-source/booksource-third-party/issues
// @function      categories
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==

/**
 * 分类配置
 */
function categories() {
    return {
        code: 0,
        message: 'success',
        data: {
            children: [
                {
                    key: '男生排行', value: 1, child: {
                        children: [
                            { key: '人气榜', value: 0 },
                            { key: '好评榜', value: 1 },
                            { key: '完结榜', value: 2 },
                            { key: '新书榜', value: 3 },
                            { key: '热搜榜', value: 4 },
                            { key: '推荐榜', value: 5 },
                        ]
                    },
                },
                {
                    key: '女生排行', value: 2, child: {
                        children: [
                            { key: '人气榜', value: 0 },
                            { key: '好评榜', value: 1 },
                            { key: '完结榜', value: 2 },
                            { key: '新书榜', value: 3 },
                            { key: '热搜榜', value: 4 },
                            { key: '推荐榜', value: 5 },
                        ]
                    },
                },
                {
                    key: '男生频道', value: 11, child: {
                        children: [
                            { key: '玄幻魔法', value: 1 },
                            { key: '武侠修真', value: 2 },
                            { key: '都市生活', value: 3 },
                            { key: '历史军事', value: 4 },
                            { key: '游戏竞技', value: 5 },
                            { key: '科幻灵异', value: 6 },
                            { key: '恐怖悬疑', value: 7 },
                            { key: '穿越架空', value: 8 },
                            { key: '短篇经典', value: 9 },
                        ]
                    },
                },
                {
                    key: '女生频道', value: 12, child: {
                        children: [
                            { key: '古代言情', value: 10 },
                            { key: '现代言情', value: 11 },
                            { key: '幻想奇缘', value: 12 },
                            { key: '青春校园', value: 13 },
                            { key: '网络情缘', value: 14 },
                            { key: 'N次い元', value: 16 },
                            { key: '言情美文', value: 17 },
                            { key: '其他类型', value: 18 },
                        ]
                    },
                },
            ],
        },
    };
}

/**
 * 分类
 * @param {Object} categories 选中的分类配置
 * @param {Object} opaque 透传数据
 * @return {Object} 返回书籍列表数据
 */
async function category(categories, opaque) {
    let page = opaque ? opaque.page : 0;
    let reqUrl = categories[0] < 10 ? "https://api.97yd.com/top" : "https://api.97yd.com/sortlist"
    let reqData = categories[0] < 10 ? `bid=${categories[0]}&type=${categories[1]}&page=${page}` : `sortid=${categories[1]}&page=${page}`
    let resp = await fetch(reqUrl, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        data: reqData
    })
    if (resp.status !== 200) {
        return {
            code: resp.status,
            message: 'Network error!',
        };
    }
    let jsonData = JSON.parse(resp.data).data
    let result = [];
    for (let item of jsonData) {
        result.push({
            id: item.bookid,
            name: item.title,
            author: item.author,
            category: item.sortname,
            intro: item.desc,
            cover: item.img,
            words: item.words * 10000,
            status: item.status === "1" ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更;
        },)
    }
    return {
        code: 0,
        message: 'success',
        // 分页数据
        data: {
            // 书籍数据
            data: result,
            // 是否有更多数据
            hasMore: result.length !== 0,
            // 如果 hasMore 为 true, 在请求下一页时, opaque 将会传入 search 方法
            opaque: {
                // 透传数据
                page: page + 1
            },
        },
    };
}

/**
 * 搜索
 * @param keyword {String} 关键字
 * @param opaque {Object} 透传数据
 * @return {Object} 返回书籍列表数据
 */
async function search(keyword, opaque) {
    let page = opaque ? opaque.page : 0;
    let resp = await fetch(`https://www.97yd.com/search`, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'type': 'app',
        },
        method: 'POST',
        data: `keyword=${keyword}&page=${page}`
    })
    if (resp.status !== 200) {
        return { code: resp.status, message: 'Network error!' };
    }
    let jsonData = JSON.parse(resp.data).data;
    return {
        data: {
            data: jsonData?.map((e) => {
                return {
                    id: e.bookid,
                    name: e.title,
                    author: e.author,
                    category: e.sortname,
                    intro: e.desc,
                    cover: e.img,
                    words: e.words_w * 10000,
                    status: (e.status === undefined || e.status === "1") ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更;
                };
            }),
            hasMore: jsonData ? jsonData.length !== 0 : false,
            opaque: {
                page: page + 1
            },
        },
    };
}

/**
 * 详情
 * @param {String} id 书籍ID
 * @return {Object} 返回书籍数据
 */
async function detail(id) {
    let resp = await fetch(`https://api.97yd.com/info`, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'type': 'app',
        },
        method: 'POST',
        data: `bookid=${id}&type=all`
    })
    if (resp.status !== 200) {
        return {
            code: resp.status,
            message: 'Network error!',
        };
    }
    let jsonData = JSON.parse(resp.data).data;
    return {
        code: 0,
        message: 'success',
        // 书籍数据
        data: {
            id: jsonData.bookid,
            name: jsonData.title,
            author: jsonData.author,
            category: jsonData.sortname,
            intro: jsonData.intro,
            cover: jsonData.img,
            words: jsonData.words_w * 10000,
            updateTime: Date.parseWithFormat(jsonData.lastupdate.replace("更新", ""), "yyyy-MM-dd"), // 更新日期
            lastChapterName: jsonData.lastchapter,
            status: jsonData.status === "连载中" ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更;
        },
    };
}

/**
 * 目录
 * @param {String} id 书籍ID
 * @return {Object} 返回目录树数据
 */
async function toc(id) {
    let resp = await fetch(`https://api.97yd.com/menu`, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'type': 'app',
        },
        method: 'POST',
        data: `bookid=${id}&start=0`
    })
    if (resp.status !== 200) {
        return {
            code: resp.status,
            message: 'Network error!',
        };
    }
    let jsonData = JSON.parse(resp.data).data;
    let result = [];
    for (let item of jsonData) {
        result.push({
            id: item.chapterid,
            name: item.chaptername,
        },)
    }
    return {
        code: 0,
        message: 'success',
        // 书籍目录
        data: result,
    };
}

/**
 * 章节
 * @param {String} bid 书籍ID
 * @param {String} cid 章节ID
 * @return {Object} 返回章节数据
 */
async function chapter(bid, cid) {
    let resp = await fetch(`https://api.97yd.com/reader`, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'type': 'app',
        },
        method: 'POST',
        data: `bookid=${bid}&chapterid=${cid}`
    })
    if (resp.status !== 200) {
        return {
            code: resp.status,
            message: 'Network error!',
        };
    }
    let jsonData = JSON.parse(resp.data).data;
    return {
        code: 0,
        message: 'success',
        data: {
            finalUrl: 'https://api.97yd.com/reader',
            body: jsonData,
        },
    };
}
