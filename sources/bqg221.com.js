// ==UserScript==
// @name          笔趣阁
// @domain        bqg221.com
// @version       1.0.0
// @supportURL    https://github.com/open-book-source/booksource-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// @function      categories
// ==/UserScript==

function parseSetCookie(cookie) {
  let arr = cookie.replace(/expires=(.*?)GMT/g, function ($1) {
    return "expires=" + new Date($1).getTime();
  }).split(", ");

  let cookies = [];
  for (let i = 0; i < arr.length; i++) {
    let cookie = parse(/([^=;\s]+)=([^;]+);?/g, arr[i].replace(/; httponly/g, "$&=true"));
    cookies.push(cookie);
  }

  function parse(reg, text) {
    if (!reg || !text) return {}
    const hash = {};
    let res = reg.exec(text);
    while (res !== null) {
      hash[res[1]] = res[2];
      res = reg.exec(text);
    }
    return hash;
  }

  return cookies;
}

// 搜索
async function search(keyword, opaque) {
  let query = encodeURIComponent(keyword);
  let hmResponse = await fetch(`https://www.bqg221.com/user/hm.html?q=${query}`)
  if (hmResponse.status !== 200) {
    return {
      code: hmResponse.status,
      message: 'Network error!',
    };
  }
  let hm = parseSetCookie(hmResponse.headers.get('set-cookie')[0]).find((e) => e.hm);
  const headers = {};
  if (hm) {
    headers['Cookie'] = `hm=${hm.hm}`;
  }
  let response = await fetch(`https://www.bqg221.com/user/search.html?q=${query}`, {
    headers: headers,
  });
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }

  let items = JSON.parse(response.data);
  let array = [];
  for (let i = 0; i < items.length; i++) {
    try {
      let item = items[i];
      let name = item.articlename;
      let url = item.url_list;
      let id = Uri.parse(url).pathSegments[1];
      let cover = item.url_img;
      let author = item.author;
      let intro = item.intro;
      array.push({
        id: id,
        name: name,
        cover: cover,
        author: author,
        intro: intro,
        opaque: undefined,
      });
    } catch (e) {
    }
  }
  return {
    data: {
      data: array,
    },
  };
}

// 详情
async function detail(id) {
  let response = await fetch(`https://www.bqg221.com/biquge/${id}/`);
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let uri = Uri.parse(response.finalUrl);
  let $ = new Document(response.data);
  let name = $.querySelector("div.info > h1").ownText.trim();
  let author = $.querySelector("div.info span:nth-child(1)").text.match(/：(.*)/)[1];
  let intro = $.querySelector("div.info > div.intro > dl > dd").text.trim();
  let cover = uri.resolve($.querySelector("div.info > div.cover > img").getAttribute("src")).toString();
  let updateTime = Date.parseWithFormat($.querySelector("div.info > div.small > span:nth-child(3)").text.match(/：(.*)/)[1], "yyyy-MM-dd HH:mm:ss");
  let lastChapterName = $.querySelector("div.info > div.small > span:nth-child(4) > a").text;
  let status = $.querySelector("div.info > div.small > span:nth-child(2)").text.includes('连载') ? 0 : 1;
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
  let response = await fetch(`https://www.bqg221.com/biquge/${id}/`);
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }

  let uri = Uri.parse(response.finalUrl);
  let $ = new Document(response.data);
  let items = $.querySelectorAll(`.listmain a`)
  let array = [];
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let url = item.getAttribute('href');
    if (url.startsWith('javascript:')) continue;
    array.push({
      name: item.text,
      id: url.match(/\/([^\/]*)\./)[1],
      url: uri.resolve(url).toString(),
    });
  }
  return {
    data: array,
  };
}

// 章节
async function chapter(bid, cid) {
  let response = await fetch(`https://www.bqg221.com/biquge/${bid}/${cid}.html`);
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let $ = new Document(response.data);
  let contentElement = $.querySelector("#chaptercontent");
  let readinlineElement = contentElement.querySelector(".readinline");
  if (readinlineElement) readinlineElement.remove();
  let html = contentElement.innerHtml;
  let title = $.querySelector("div.content > h1.wap_none").text.replace(' ', '');
  return {
    data: {
      finalUrl: response.finalUrl,
      body: html.replace(title, '').replace(/(<br>((?!<br>).)*请收藏(本站)?：((?!<br>).)*<br>)/, ' '),
    },
  };
}

const categories = {
  data: {
    children: [
      { key: '玄幻', value: '1' },
      { key: '武侠', value: '2' },
      { key: '都市', value: '3' },
      { key: '历史', value: '4' },
      { key: '网游', value: '5' },
      { key: '科幻', value: '6' },
      { key: '女生', value: '7' },
      { key: '完本', value: '0' },
    ],
  },
};

async function category(categories, opaque) {
  let type = categories[0];
  let page = opaque ? opaque.page : 1;
  let response = await fetch(`https://www.bqg221.com/json?sortid=${type}&page=${page}`);
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let items = JSON.parse(response.data);
  let array = [];
  for (let i = 0; i < items.length; i++) {
    try {
      let item = items[i];
      let name = item.articlename;
      let url = item.url_list;
      let id = Uri.parse(url).pathSegments[1];
      let cover = item.url_img;
      let author = item.author;
      let intro = item.intro;
      array.push({
        id: id,
        name: name,
        cover: cover,
        author: author,
        intro: intro,
      });
    } catch (e) {
    }
  }
  let hasMore = array.length > 0;
  return {
    data: {
      data: array,
      hasMore: hasMore,
      opaque: {
        page: hasMore ? ++page : undefined,
      },
    },
  };
}
