// ==UserScript==
// @name          大文学
// @domain        wcxsw.org
// @description   慎用, 网站有5秒盾, 使用时需要在设置页面进行授权.
// @version       1.0.0
// @supportURL    https://github.com/open-book-source/booksource-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// @function      authorization
// ==/UserScript==

// 搜索
async function search(keyword, opaque) {
  let response = await fetch(`https://www.wcxsw.org/modules/article/search.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded', // 必须, 表明是表单数据
      'User-Agent': UserAgents.macos,
      // 如何获取 cookie 来通过人机验证?
      'Cookie': await Storage.get('cookie'),
    },
    // 如果参数不是 utf-8 编码, 就只能采取这种方式.
    data: `keyword=${await Codec.encodeURIComponent(keyword, 'utf-8')}`,
    // data: { "keyword": keyword },
  });
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let $ = new Document(response.data);
  let items = $.querySelectorAll("#main > div.novelslist2 > ul > li:nth-child(n+2)");
  let array = [];
  for (let i = 0; i < items.length; i++) {
    try {
      let item = items[i];
      let nameElement = item.querySelector("span.s2 > a");
      let name = nameElement.text;
      let url = nameElement.getAttribute('href');
      let id = url.match(/\/([a-z0-9]+)\/?$/)[1];
      let dir = id.slice(0, -3);
      let cover = `https://www.wcxsw.org/image/${dir}/${id}/${id}s.jpg`;
      let author = item.querySelector("span.s4").text;
      let updateTime = new Date(item.querySelector("span:nth-child(5)").text);
      let lastChapterName = item.querySelector("span.s3").text;
      let category = item.querySelector("span.s1").text.match(/\[(.*)\]/)[1];
      let status = item.querySelector("span:nth-child(6)").text === '完结' ? 1 : 0;
      array.push({
        id: id,
        name: name,
        cover: cover,
        author: author,
        updateTime: updateTime,
        lastChapterName: lastChapterName,
        category: category,
        status: status,
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
  let response = await fetch(`https://www.wcxsw.org/${id}/`, {
    headers: {
      'User-Agent': UserAgents.macos,
      'Cookie': await Storage.get('cookie'),
    },
  });
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let uri = Uri.parse(response.finalUrl);
  let $ = new Document(response.data);
  let name = $.querySelector("#info > h1").text;
  let author = $.querySelector("#info > p:nth-child(2)").text.match(/：(.*)/)[1];
  let intro = $.querySelector("#intro").text;
  let cover = uri.resolve($.querySelector("#fmimg > img").getAttribute("src")).toString();
  let updateTime = Date.parseWithFormat($.querySelector("#info > p:nth-child(4)").text.match(/：(.*)/)[1], "yyyy-MM-dd HH:mm:ss");
  let lastChapterName = $.querySelector("#info > p:nth-child(5) > a").text;
  let category = $.querySelector("#wrapper > div:nth-child(5) > div.con_top > a:nth-child(2)").text;
  let status = $.querySelector("#info > p:nth-child(3)").text.match(/：([^,]*)/)[1] === "完结" ? 1 : 0;
  return {
    data: {
      id: id,
      name: name,
      author: author,
      intro: intro,
      cover: cover,
      updateTime: updateTime,
      lastChapterName: lastChapterName,
      category: category,
      status: status,
      opaque: undefined,
    }
  };
}

// 目录
async function toc(id) {
  let response = await fetch(`https://www.wcxsw.org/${id}/`, {
    headers: {
      'User-Agent': UserAgents.macos,
      'Cookie': await Storage.get('cookie'),
    },
  });
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let uri = Uri.parse(response.finalUrl);
  let $ = new Document(response.data);
  let items = $.queryXpath(`//div[@id="list"]/dl/dt[2]/following-sibling::dd/a`)
  let array = [];
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let url = item.getAttribute('href');
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
  let url = `https://www.wcxsw.org/${bid}/${cid}.html`;
  let response = await fetch(url, {
    headers: {
      'User-Agent': UserAgents.macos,
      'Cookie': await Storage.get('cookie'),
    },
  });
  if (response.status !== 200) {
    return {
      code: response.status,
      message: 'Network error!',
    };
  }
  let $ = new Document(response.data);
  return {
    data: {
      finalUrl: response.finalUrl,
      body: $.querySelector("#content").outerHtml,
    },
  };
}

// 人机验证
async function authorization() {
  let response = await UI.authorization(0, 'https://www.wcxsw.org/modules/article/search.php', 'https://www.wcxsw.org', {
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
