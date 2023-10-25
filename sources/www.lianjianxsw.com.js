// ==UserScript==
// @name          读书阁
// @domain        www.lianjianxsw.com
// @version       1.0.0
// @supportURL    https://github.com/open-book-source/booksource-third-party/issues
// @require       https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/crypto-js/4.1.1/crypto-js.min.js
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==


async function search(keyword, opaque) {
    let page = opaque ? opaque.page : 1;
    let resp = await fetch(`http://www.lianjianxsw.com/search`, {
        method: 'POST',
        headers: {
            "User-Agent": UserAgents.android,
        },
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        data: JSON.stringify({ "keyword": keyword })
    });
    if (resp.status !== 200) {
        return {
            code: resp.status,
            message: 'Network error!',
        };
    }
    let jsonData = JSON.parse(resp.data);
    if (jsonData.errCode !== 200) {
        return { code: jsonData.errCode, message: jsonData.errorMsg };
    }
    return {
        data: {
            data: jsonData.data.map((e) => {
                return {
                    id: e._id + "",
                    name: e.name,
                    author: e.author,
                    intro: e.intro,
                    cover: `http://www.lianjianxsw.com/pic/${e._id}.jpg`,
                    words: e.book_size,
                }
            }),
            opaque: {
                page: page + 1,
            }
        }
    };
}

async function detail(id) {
    let resp = await fetch(`http://www.lianjianxsw.com/bookInfo?bookid=${id}`)
    if (resp.status !== 200) {
        return {
            code: resp.status,
            message: 'Network error!',
        };
    }
    let jsonData = JSON.parse(resp.data);
    if (jsonData.errCode !== 200) {
        return { code: jsonData.errCode, message: jsonData.errorMsg };
    }
    let bookData = jsonData.data.book;
    return {
        data: {
            id: bookData._id,
            name: bookData.name,
            author: bookData.author,
            category: bookData.type,
            intro: bookData.intro,
            cover: `http://www.lianjianxsw.com/pic/${bookData._id}.jpg`,
            words: bookData.book_size,
            updateTime: Date.parseWithFormat(bookData.updatetime, "yyyy-MM-dd HH:mm:ss"),
            lastChapterName: bookData.last_chapter_name,
            status: bookData.update_state == '连载' ? 0 : 1,
        }
    }
}

async function toc(id) {
    let resp = await fetch(`http://www.lianjianxsw.com/getCataLogs?bookid=${id}&page=1&limit=1000000`, {
      headers: { "User-Agent": UserAgents.android },
    });
    if (resp.status !== 200) {
      return {
        code: resp.status,
        message: 'Network error!',
      };
    }
    let jsonData = JSON.parse(resp.data);
    if (jsonData.errCode !== 200) {
        return { code: jsonData.errCode, message: jsonData.errorMsg };
    }
    return {
      data: jsonData.data.list.map((e) => {
        return {
          id: e._id,
          name: e.name,
          url: `https://www.xmkanshu.com/service/getContent?fr=smsstg&v=4&uid=B197589CF54DC527538FADCAE6BDBC78&urbid=%2Fbook_95_0&bkid=${id}&crid=${e.chapter_id}&pg=1`,
        }
      }),
    };
  }


async function chapter(bid, cid) {
    let resp = await fetch(`http://www.lianjianxsw.com/getContent?bookid=${bid}&chapterid=${cid}`);
    if (resp.status !== 200) {
      return { code: resp.status, message: 'Network error!' };
    }
    let jsonData = JSON.parse(resp.data);
    if (jsonData.errCode !== 200) {
        return { code: jsonData.errCode, message: jsonData.errorMsg };
    }
    return {
      data: {
        method: 'GET',
        finalUrl: resp.finalUrl,
        body: decrypt(jsonData.data.chapterInfo.content).replaceAll("###$$$","\n"),
      },
    };
  }
  
  const decrypt = function (data) {
    let key = CryptoJS.enc.Utf8.parse('6CE93717FBEA3E4F')
    let iv = CryptoJS.enc.Utf8.parse('6CE93717FBEA3E4F')
    decrypted = CryptoJS.AES.decrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.NoPadding
    })
    return decrypted.toString(CryptoJS.enc.Utf8)
  }