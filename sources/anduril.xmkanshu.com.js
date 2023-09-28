// ==UserScript==
// @name          熊猫看书
// @domain        anduril.xmkanshu.com
// @version       1.0.0
// @supportURL    https://github.com/open-book-source/booksource-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==


async function search(keyword, opaque) {
  let page = opaque ? opaque.page : 1;
  let resp = await fetch(`https://anduril.xmkanshu.com/v3/search/get_result?keyword=${keyword}&page_number=${page}&is_vip_free=0&page_size=20&sub_type=1`, {
    method: 'GET',
    headers: {
      "User-Agent": UserAgents.android,
    },
  });
  if (resp.status !== 200) {
    return {
      code: resp.status,
      message: 'Network error!',
    };
  }
  let jsonData = JSON.parse(resp.data);
  if (jsonData.code !== 0) {
    return { code: jsonData.code, message: jsonData.msg };
  }
  return {
    data: {
      data: jsonData.result.books.map((e) => {
        return {
          id: e.book_id + "",
          name: e.book_name,
          author: e.author_name,
          category: e.book_type_name,
          intro: e.book_desc,
          cover: e.cover_picture,
          words: e.book_size,
        }
      }),
      hasMore: jsonData.result.has_more == 1,
      opaque: {
        page: page + 1,
      }
    }
  };
}

async function detail(id) {
  let resp = await fetch(`https://anduril.xmkanshu.com/v3/book/get_book_info?p1=H5&p2=PandaBookAndroid5641&book_id=${id}&site_id=0`)
  if (resp.status !== 200) {
    return {
      code: resp.status,
      message: 'Network error!',
    };
  }
  let jsonData = JSON.parse(resp.data);
  if (jsonData.code !== 0) {
    return { code: jsonData.code, message: jsonData.msg };
  }
  let bookData = jsonData.result;
  return {
    data: {
      id: bookData.book_id,
      name: bookData.book_name,
      author: bookData.author_name,
      authorId: bookData.author_id,
      category: bookData.book_category_full_name,
      intro: bookData.cover_picture,
      cover: bookData.cover_url,
      words: bookData.book_size,
      updateTime: Date.parseWithFormat(bookData.last_update_time, "yyyy-MM-dd HH:mm:ss"),
      lastChapterName: bookData.last_chapter_name,
      status: bookData.book_status == 50 ? 0 : 1,
    }
  }
}


async function toc(id) {
  let resp = await fetch(`https://anduril.xmkanshu.com/v3/book/get_last_chapter_list?bookid=${id}&page=1&pagesize=100000&lastchapterid=0`, {
    headers: { "User-Agent": UserAgents.android },
  });
  if (resp.status !== 200) {
    return {
      code: resp.status,
      message: 'Network error!',
    };
  }
  let jsonData = JSON.parse(resp.data);
  if (jsonData.code !== 0) {
    return { code: jsonData.code, message: jsonData.msg };
  }
  return {
    data: jsonData.result.pageList.map((e) => {
      return {
        id: e.chapter_id,
        name: e.chapter_name,
        url: `https://www.xmkanshu.com/service/getContent?fr=smsstg&v=4&uid=B197589CF54DC527538FADCAE6BDBC78&urbid=%2Fbook_95_0&bkid=${id}&crid=${e.chapter_id}&pg=1`,
      }
    }),
  };
}

async function chapter(bid, cid) {
  let resp = await fetch(`https://www.xmkanshu.com/service/getContent?fr=smsstg&v=4&uid=B197589CF54DC527538FADCAE6BDBC78&urbid=%2Fbook_95_0&bkid=${bid}&crid=${cid}&pg=1`, {
    headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10; AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.106 Mobile Safari/537.36" },
  });
  if (resp.status !== 200) {
    return {
      code: resp.status,
      message: 'Network error!',
    };
  }
  let chapterContent = ""
  let jsonData = JSON.parse(resp.data);
  for (let pageIndex = 2; pageIndex <= jsonData.result.pagecount; pageIndex++) {
    let resp = await fetch(`https://www.xmkanshu.com/service/getContent?fr=smsstg&v=4&uid=B197589CF54DC527538FADCAE6BDBC78&urbid=%2Fbook_95_0&bkid=${bid}&crid=${cid}&pg=${pageIndex}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10; AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.106 Mobile Safari/537.36" },
    });
    if (resp.status !== 200) {
      return {
        code: resp.status,
        message: 'Network error!',
      };
    }
    let jsonData = JSON.parse(resp.data);
    console.log(jsonData)
    chapterContent += jsonData.result.content;
  }
  return {
    data: {
      finalUrl: `https://www.xmkanshu.com/service/getContent?fr=smsstg&v=4&uid=B197589CF54DC527538FADCAE6BDBC78&urbid=%2Fbook_95_0&bkid=${bid}&crid=${cid}&pg=1`,
      body: chapterContent,
    },
  }
}