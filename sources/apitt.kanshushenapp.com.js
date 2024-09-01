// ==UserScript==
// @status        obsolete
// @name          看书神
// @domain        apitt.kanshushenapp.com
// @version       1.0.2
// @supportURL    https://github.com/open-source-scripts/book-scripts-third-party/issues
// @require       https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/crypto-js/4.1.1/crypto-js.min.js
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// @function      categories
// ==/UserScript==

async function search(keyword, opaque) {
  let token = CryptoJS.MD5(`auth_shipsay_941376${new Date().getMinutes()}`).toString();
  let response = await fetch(`http://apitt.kanshushenapp.com/json/api_search.php?searchkey=${keyword}&token=${token}`);
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = JSON.parse(response.data);
  let array = [];
  if ($.result_rows instanceof Array) {
    $.result_rows.forEach(e => {
      array.push({
        id: e.articleid,
        name: e.articlename,
        author: e.author,
        category: e.sortname,
        intro: e.intro_des,
        cover: e.img_url,
        words: e.words,
        updateTime: new Date(parseInt(e.lastupdate) * 1000), // 更新日期
        lastChapterName: e.lastchapter,
        status: e.fullflag === '0' ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更; 
      });
    });
  }
  return {
    data: {
      data: array,
    },
  };
}

async function detail(id) {
  let token = CryptoJS.MD5(`auth_shipsay_941376${new Date().getMinutes()}`).toString();
  let response = await fetch(`http://apitt.kanshushenapp.com/json/api_info.php?aid=${id}&token=${token}`);
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = JSON.parse(response.data);
  return {
    data: {
      id: $.articleid,
      name: $.articlename,
      author: $.author,
      category: $.sortname,
      intro: $.intro.trim(),
      cover: $.img_url,
      words: $.words_w * 10000,
      updateTime: new Date(parseInt($.lastupdate) * 1000), // 更新日期
      lastChapterName: $.lastchapter,
      status: $.fullflag === '0' ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更; 
    },
  };
}

async function toc(id) {
  let token = CryptoJS.MD5(`auth_shipsay_941376${new Date().getMinutes()}`).toString();
  let page = 1;
  let hasMore = true;
  let array = [];
  while (hasMore) {
    let response = await fetch(`http://apitt.kanshushenapp.com/json/api_indexlist.php?aid=${id}&per=20000&page=${page}&token=${token}`);
    if (response.status !== 200) {
      throw new NetworkError(response.status);
    }
    let $ = JSON.parse(response.data);
    $.chapterrows.forEach(e => {
      array.push({
        id: e.chapterid,
        name: e.chaptername,
      });
    });
    hasMore = page < $.pages;
    page++;
  }
  return {
    data: array,
  };
}

async function chapter(bid, cid) {
  let token = CryptoJS.MD5(`auth_shipsay_941376${new Date().getMinutes()}`).toString();
  let response = await fetch(`http://apitt.kanshushenapp.com/json/api_read.php?aid=${bid}&cid=${cid}&token=${token}`);
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = JSON.parse(response.data);
  return {
    data: {
      finalUrl: response.finalUrl,
      body: $.content,
    },
  };
}

const categories = {
  data: {
    children: [
      {key: '全部', value: '0'},
      {key: '玄幻魔法', value: '1'},
      {key: '武侠修真', value: '2'},
      {key: '都市言情', value: '3'},
      {key: '历史军事', value: '4'},
      {key: '科幻灵异', value: '6'},
      {key: '游戏竞技', value: '5'},
      {key: '女生耽美', value: '7'},
      {key: '其他类型', value: '8'},
    ],
  },
};

async function category(categories, opaque) {
  let type = categories[0];
  let page = opaque ? opaque.page : 1;
  let pre = 30;
  let token = CryptoJS.MD5(`auth_shipsay_941376${new Date().getMinutes()}`).toString();
  let response = await fetch(`http://apitt.kanshushenapp.com/json/api_class_list.php?page=${page}&per=${pre}&sortid=${type}&token=${token}`);
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }

  let $ = JSON.parse(response.data);
  let array = [];
  $.forEach(e => {
    array.push({
      id: e.articleid,
      name: e.articlename,
      author: e.author,
      category: e.sortname,
      intro: e.intro_des,
      cover: e.img_url,
      words: e.words,
      updateTime: new Date(parseInt(e.lastupdate) * 1000), // 更新日期
      lastChapterName: e.lastchapter,
      status: e.fullflag === '0' ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更; 
    });
  });
  return {
    data: {
      data: array,
      hasMore: array.length >= pre,
      opaque: {
        page: ++page,
      },
    },
  };
}
