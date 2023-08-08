// ==UserScript==
// @name          米读小说
// @domain        mdxs123.com
// @version       1.0.1
// @supportURL    https://github.com/open-book-source/booksource-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// @function      categories
// ==/UserScript==

async function search(keyword, opaque) {
  let htmlResp = await fetch(`https://www.mdxs123.com/user/hm.html?q=${encodeURIComponent(keyword)}`, {
    method: 'GET',
    headers: {
      "User-Agent": UserAgents.macos,
    },
  })
  if (htmlResp.status !== 200) {
    return {
      code: htmlResp.status,
      message: 'Network error!',
    };
  }
  // 获取 cookie
  const cookie = htmlResp.headers.get('set-cookie')[0]
  // 清理一下 cookie 的格式，移除过期时间，只保留基础的键值对才能正常使用
  const req_cookie = cookie
    .replace(/expires=(.+?);\s/gi, '')
    .replace(/path=\/(,?)(\s?)/gi, '')
    .trim()
  let resp = await fetch(`https://www.mdxs123.com/user/search.html?q=${encodeURIComponent(keyword)}`, {
    method: 'GET',
    headers: {
      "User-Agent": UserAgents.macos,
      'Cookie': req_cookie,
    },
  })
  if (resp.status !== 200) {
    return {
      code: resp.status,
      message: 'Network error!',
    };
  }
  let jsonData = JSON.parse(resp.data)
  let result = [];
  for (let item of jsonData) {
    let url = item.url_list
    result.push({
      id: url.match(/\/book\/(\d+)\//)[1],
      name: item.articlename,
      author: item.author,
      // category: category,
      intro: item.intro,
      cover: item.url_img,
      // updateTime: data, // 更新日期
      // lastChapterName: lastChapterName,
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

async function detail(id) {
  let idObj = JSON.parse(id)
  let response = await fetch(`https://www.mdxs123.com/book/${id}/`, {
    headers: { "User-Agent": UserAgents.macos },
  });
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let uri = Uri.parse(response.finalUrl);
  let doc = new Document(response.data);
  let name = doc.querySelector(".info > h1").ownText.trim();
  let author = doc.querySelector(".info > .small > span:nth-of-type(1)").text.replace("作者：", "");
  let intro = doc.querySelector(".info > .intro").text.replace("展开全部>>", "").trim();
  let cover = uri.resolve(doc.querySelector(".info > .cover > img").getAttribute("src")).toString();
  let updateTime = Date.parseWithFormat(doc.querySelector(".info > .small > span:nth-of-type(3)").text.replace("更新：", ""), "yyyy-MM-dd HH:mm:ss");
  let lastChapterName = doc.querySelector(".info > .small > span:nth-of-type(4) a").text;
  let status = doc.querySelector(".info > .small > span:nth-of-type(2)") === "状态：连载" ? 1 : 0;
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
  let response = await fetch(`https://www.mdxs123.com/book/${id}/`, {
    headers: { "User-Agent": UserAgents.macos },
  });
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let uri = Uri.parse(response.finalUrl);
  let doc = new Document(response.data);
  let items = doc.querySelectorAll('.listmain dl dd:not([class]) a')
  let array = [];
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let url = item.getAttribute('href');
    array.push({
      name: item.text,
      id: url.match(/\/book\/(\d+)\/(\d+).html/)[2],
      url: uri.resolve(url).toString(),
    });
  }
  return {
    data: array,
  };
}

async function chapter(bid, cid) {
  let response = await fetch(`https://www.mdxs123.com/book/${bid}/${cid}.html`, {
    headers: { "User-Agent": UserAgents.macos },
  });
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let doc = new Document(response.data);
  let html = doc.querySelector("#chaptercontent").innerHtml;
  html = html.split("请收藏本站")[0]
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
      { key: '玄幻', value: "xuanhuan" },
      { key: '武侠', value: "wuxia" },
      { key: '都市', value: "dushi" },
      { key: '历史', value: "lishi" },
      { key: '网游', value: "youxi" },
      { key: '科幻', value: "kehuan" },
      { key: '女生', value: "mm" },
      { key: '完本', value: "finish" },
    ],
  },
};

async function category(categories, opaque) {
  let type = categories[0];
  let resp = await fetch(`https://www.mdxs123.com/${type}/`);
  if (resp.status !== 200) {
    return {
      code: resp.status,
      message: 'Network error!',
    };
  }
  let document = new Document(resp.data);
  let items = document.querySelectorAll(".hot .item")
  let result = [];
  for (let item of items) {
    let nameEle = item.querySelector("dl dt a");
    let name = nameEle.text;
    let matchArray = nameEle.getAttribute("href").match(/book\/(\d+)\//);
    let id = matchArray[1]
    let author = item.querySelector("dl dt span").text
    let intro = item.querySelector("dl dd").text
    let cover = item.querySelector(".image a img").getAttribute("src")
    result.push({
      id: id,
      name: name,
      author: author,
      cover: cover,
      intro: intro,
      status: 0,
    });
  }
  return {
    data: {
      data: result,
      hasMore: false,
    }
  }
}
