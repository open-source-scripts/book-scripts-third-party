// ==UserScript==
// @name          酷我小说
// @domain        appi.kuwo.cn
// @version       1.0.0
// @supportURL    https://github.com/open-book-source/booksource-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==


async function search(keyword, opaque) {
  let page = opaque ? opaque.page : 1;
  let resp = await fetch(`http://appi.kuwo.cn/novels/api/book/search?keyword=${encodeURIComponent(keyword)}&pi=${page}&ps=30`, {
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
  if (jsonData.code !== 200) {
    return { code: jsonData.code, message: jsonData.message };
  }
  return {
    data: {
      data: jsonData.data.map((e) => {
        return {
          id: e.book_id,
          name: e.title,
          author: e.author_name,
          category: e.category_name + "-" + e.sub_category_name,
          tags: e.keyword.replaceAll("|", " ").trim().split(" "),
          intro: e.intro,
          cover: e.cover_url,
          words: e.all_words,
          status: e.status == 50 ? 0 : 1,
        }
      }),
      hasMore: jsonData.paging.pi < jsonData.paging.count,
      opaque: {
        page: page + 1,
      }
    }
  };
}

async function detail(id) {
  let resp = await fetch(`http://appi.kuwo.cn/novels/api/book/${id}`)
  if (resp.status !== 200) {
    return {
      code: resp.status,
      message: 'Network error!',
    };
  }
  let jsonData = JSON.parse(resp.data);
  if (jsonData.code !== 200) {
    return { code: jsonData.code, message: jsonData.message };
  }
  let bookData = jsonData.data;
  return {
    data: {
      id: bookData.book_id,
      name: bookData.title,
      author: bookData.author_name,
      category: bookData.category_name + "-" + bookData.sub_category_name,
      tags: bookData.keyword.replaceAll("|", " ").trim().split(" "),
      intro: bookData.intro,
      cover: bookData.cover_url,
      words: bookData.all_words,
      updateTime: bookData.new_chapter_update_time,
      lastChapterName: bookData.new_chapter_name,
      status: bookData.status == 50 ? 0 : 1,
    }
  }
}


async function toc(id) {
  let resp = await fetch(`http://appi.kuwo.cn/novels/api/book/${id}/chapters?paging=0`, {
    headers: { "User-Agent": UserAgents.android },
  });
  if (resp.status !== 200) {
    return {
      code: resp.status,
      message: 'Network error!',
    };
  }
  let jsonData = JSON.parse(resp.data);
  if (jsonData.code !== 200) {
    return { code: jsonData.code, message: jsonData.message };
  }
  return {
    data: jsonData.data.map((e) => {
      return {
        id: e.chapter_id,
        name: e.chapter_title,
        url: `http://appi.kuwo.cn/novels/api/book/${id}/chapters/${e.chapter_id}`,
      }
    }),
  };
}

async function chapter(bid, cid) {
  let resp = await fetch(`http://appi.kuwo.cn/novels/api/book/${bid}/chapters/${cid}`, {
    headers: { "User-Agent": UserAgents.android },
  });
  if (resp.status !== 200) {
    return {
      code: resp.status,
      message: 'Network error!',
    };
  }
  let jsonData = JSON.parse(resp.data);
  if (jsonData.code !== 200) {
    return { code: jsonData.code, message: jsonData.message };
  }
  return {
    data: {
      finalUrl: resp.url,
      body: jsonData.data.content,
    },
  }
}