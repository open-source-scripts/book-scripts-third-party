// ==UserScript==
// @name          69书吧
// @domain        69shu.io
// @version       1.0.0
// @supportURL    https://github.com/open-book-source/booksource-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// @function      categories
// @function      authorization
// ==/UserScript==

// 搜索
async function search(keyword, opaque) {
  let page = opaque ? opaque.page : 1;
  let response = await fetch(`https://www.69shu.io/modules/article/search.php?searchkey=${await Codec.encodeURIComponent(keyword, 'gb2312')}&page=${page}`, {
    headers: {
      "User-Agent": UserAgents.macos,
      'Cookie': await Storage.get('cookie'),
    },
  });
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  // 只搜到一本书时, 会直接跳转到书籍详情页面.
  let uri = Uri.parse(response.finalUrl);
  if (uri.path.startsWith('/book')) {
    let $ = new Document(response.data);
    let id = uri.pathSegments[1];
    let name = $.querySelector("#info > h1").ownText.trim();
    let author = $.querySelector("#info h1 a").text;
    let intro = $.querySelector("#info .bookinfo_intro").text.trim();
    let cover = uri.resolve($.querySelector(".book_info img").getAttribute("src")).toString();
    let updateTime = Date.parseWithFormat($.querySelector("#info .update").text.match(/（(.*)）/)[1], "yyyy-MM-dd HH:mm");
    let lastChapterName = $.querySelector("#info .update a").text;
    let status = $.querySelector(".book_info .red") ? 1 : 0;
    return {
      data: {
        data: [
          {
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
        ],
        hasMore: false
      },
    };
  }

  let $ = new Document(response.data);
  let items = $.querySelectorAll("tr:nth-child(n+2)");
  let array = [];
  for (let i = 0; i < items.length; i++) {
    try {
      let item = items[i];
      let nameElement = item.querySelector("td:nth-child(1) a");
      let name = nameElement.text;
      let url = nameElement.getAttribute("href");
      let id = Uri.parse(url).pathSegments[1];
      let dir = id.slice(0, -3);
      let cover = `https://www.69shu.io/files/article/image/${dir}/${id}/${id}s.jpg`;
      let author = item.querySelector("td:nth-child(3)").text;
      let updateTime = Date.parseWithFormat($.querySelector("td:nth-child(5)").text, "yy-MM-dd");
      let lastChapterName = item.querySelector("td:nth-child(2)").text;
      let status = item.querySelector("td:nth-child(6)").text === "连载" ? 0 : 1;
      array.push({
        id: id,
        name: name,
        cover: cover,
        author: author,
        updateTime: updateTime,
        lastChapterName: lastChapterName,
        status: status,
        opaque: undefined,
      });
    } catch (e) {
    }
  }
  let lastPage = parseInt($.querySelector(".last"));
  return {
    data: {
      data: array,
      hasMore: lastPage > page,
      opaque: {
        page: page + 1,
      },
    },
  };
}

// 详情
async function detail(id) {
  let response = await fetch(`https://www.69shu.io/book/${id}/`, {
    headers: {"User-Agent": UserAgents.macos},
  });
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let uri = Uri.parse(response.finalUrl);
  let $ = new Document(response.data);
  let name = $.querySelector("#info > h1").ownText.trim();
  let author = $.querySelector("#info h1 a").text;
  let intro = $.querySelector("#info .bookinfo_intro").text.trim();
  let cover = uri.resolve($.querySelector(".book_info img").getAttribute("src")).toString();
  let updateTime = Date.parseWithFormat($.querySelector("#info .update").text.match(/（(.*)）/)[1], "yyyy-MM-dd HH:mm");
  let lastChapterName = $.querySelector("#info .update a").text;
  let status = $.querySelector(".book_info .red") ? 1 : 0;
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
  let array = [];

  async function request(index) {
    let response = await fetch(`https://www.69shu.io/book/${id}/index_${index}.html`, {
      headers: {"User-Agent": UserAgents.macos},
    });
    if (response.status !== 200) {
      return {
        code: response.status,
        message: 'Network error!',
      };
    }
    let uri = Uri.parse(response.finalUrl);
    let $ = new Document(response.data);
    let items = $.querySelectorAll(".chapterlist:nth-child(3) li:nth-child(n+2) a");
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let url = item.getAttribute("href");
      array.push({
        name: item.text,
        id: url.match(/([^\/]*)\./)[1],
        url: uri.resolve(url).toString(),
      });
    }
    return $.querySelectorAll('select option').length;
  }

  let size = await request(1);
  for (let i = 2; i <= size; i++) {
    await request(i);
  }
  return {
    data: array,
  };
}

// 章节
async function chapter(bid, cid) {
  let response = await fetch(`https://www.69shu.io/book/${bid}/${cid}.html`, {
    headers: {"User-Agent": UserAgents.macos},
  });
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let $ = new Document(response.data);
  let html = $.querySelector("#htmlContent").innerHtml;
  html = html.substring(html.indexOf("<br>"));
  html = html.replace(/<a[^>]*>([^<]+)<\/a>/g, "");
  html = html.replace(/&(nbsp|amp|quot|lt|gt);/g, "");
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
      {key: '玄幻', value: 1},
      {key: '修真', value: 2},
      {key: '都市', value: 3},
      {key: '历史', value: 4},
      {key: '网游', value: 5},
      {key: '科幻', value: 6},
    ],
  },
};

async function category(categories, opaque) {
  let type = categories[0];
  let page = opaque ? opaque.page : 1;
  let response = await fetch(`https://www.69shu.io/fenlei/${type}_${page}/`);
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let $ = new Document(response.data);
  let items = $.querySelectorAll(".section-cols ul li");
  let array = [];
  for (let i = 0; i < items.length; i++) {
    try {
      let item = items[i];
      let nameElement = item.querySelector(".s2 a");
      let name = nameElement.text;
      let url = nameElement.getAttribute("href");
      let id = url.split('/')[4];
      let dir = id.slice(0, -3);
      let cover = `https://www.69shu.io/files/article/image/${dir}/${id}/${id}s.jpg`
      let author = item.querySelector(".s4").text;
      let lastChapterName = item.querySelector(".s3").text;
      array.push({
        id: id,
        name: name,
        cover: cover,
        author: author,
        lastChapterName: lastChapterName,
      });
    } catch (e) {
    }
  }
  let next = $.querySelector('#pagelink a.next');
  let hasMore = !!next;
  return {
    data: {
      data: array,
      hasMore: hasMore,
      opaque: {
        page: hasMore ? next.getAttribute('href').split('_')[1].replace('/', '') : undefined,
      },
    },
  };
}

// 人机验证
async function authorization() {
  let response = await UI.authorization(0, 'https://www.69shu.io/modules/article/search.php', 'https://www.69shu.io', {
    userAgent: UserAgents.macos,
  });
  // 判断是否已通过人机认证
  if (response && response.indexOf('cf_clearance=') !== -1) {
    await Storage.put('cookie', response);
    return true;
  }
  return false;
}

async function unauthorization() {
  return Storage.delete('cookie');
}

// 是否已授权
async function authenticated() {
  return Storage.exists('cookie');
}
