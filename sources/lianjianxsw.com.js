// ==UserScript==
// @name          读书阁
// @domain        lianjianxsw.com
// @version       1.0.1
// @supportURL    https://github.com/open-source-scripts/book-scripts-third-party/issues
// @require       https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/crypto-js/4.1.1/crypto-js.min.js
// @function      categories
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==

function categories() {
  return {
    data: {
      children: [
        {key: '全部', value: '全部'},
        {key: '都市', value: '都市'},
        {key: '科幻', value: '科幻'},
        {key: '女频', value: '女频'},
        {key: '历史', value: '历史'},
        {key: '网游', value: '网游'},
        {key: '玄幻', value: '玄幻'},
        {key: '修真', value: '修真'},
        {key: '其他', value: '其他'},
      ],
    },
  };
}

async function category(categories, opaque) {
  let type = categories[0];
  let page = opaque ? opaque.page : 1;
  let response = await fetch(`http://www.lianjianxsw.com/rankList?type=${type}&page=${page}&state=0`);
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = JSON.parse(response.data);
  if ($.errCode !== 200) {
    throw new SourceError(`${$.errorMsg}(${$.errCode})`);
  }
  let array = [];
  $.data.forEach(e => {
    array.push({
      id: e._id,
      name: e.name,
      author: e.author,
      intro: e.intro,
      cover: `http://www.lianjianxsw.com/pic/${e._id}.jpg`,
    });
  });
  return {
    data: {
      data: array,
      hasMore: array.length > 10,
      opaque: {
        page: ++page,
      },
    },
  };
}

async function search(keyword, opaque) {
  let response = await fetch(`http://www.lianjianxsw.com/search`, {
    method: 'POST',
    data: {keyword: keyword},
  });
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = JSON.parse(response.data);
  if ($.errCode !== 200) {
    throw new SourceError(`${$.errorMsg}(${$.errCode})`);
  }
  let array = [];
  $.data.forEach(e => {
    array.push({
      id: e._id,
      name: e.name,
      author: e.author,
      intro: e.intro,
      cover: `http://www.lianjianxsw.com/pic/${e._id}.jpg`,
    });
  });
  return {
    data: {
      data: array,
    },
  };
}

async function detail(id) {
  let response = await fetch(`http://www.lianjianxsw.com/bookInfo?bookid=${id}`);
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = JSON.parse(response.data);
  if ($.errCode !== 200) {
    throw new SourceError(`${$.errorMsg}(${$.errCode})`);
  }
  return {
    data: {
      id: $.data.book._id,
      name: $.data.book.name,
      author: $.data.book.author,
      category: $.data.book.type,
      intro: $.data.book.intro,
      cover: `http://www.lianjianxsw.com/pic/${$.data.book._id}.jpg`,
      updateTime: Date.parseWithFormat($.data.book.updatetime, 'yyyy-MM-dd HH:mm:ss'), // 更新日期
      lastChapterName: $.data.book.last_chapter_name,
      status: $.data.book.update_state === '连载' ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更; 
    },
  };
}

async function toc(id) {
  let page = 1;
  let hasMore = true;
  let array = [];
  while (hasMore) {
    let response = await fetch(`http://www.lianjianxsw.com/getCataLogs?bookid=${id}&page=${page}&limit=1000`);
    if (response.status !== 200) {
      throw new NetworkError(response.status);
    }
    let $ = JSON.parse(response.data);
    if ($.errCode !== 200) {
      throw new SourceError(`${$.errorMsg}(${$.errCode})`);
    }
    $.data.list.forEach(e => {
      array.push({
        id: e._id,
        name: e.name,
      });
    });
    hasMore = page < $.data.total;
    page++;
  }
  return {
    data: array,
  };
}

async function chapter(bid, cid) {
  let response = await fetch(`http://www.lianjianxsw.com/getContent?bookid=${bid}&chapterid=${cid}`);
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = JSON.parse(response.data);
  if ($.errCode !== 200) {
    throw new SourceError(`${$.errorMsg}(${$.errCode})`);
  }
  let key = iv = CryptoJS.enc.Utf8.parse('6CE93717FBEA3E4F');
  let body = CryptoJS.AES.decrypt(CryptoJS.lib.CipherParams.create({ciphertext: CryptoJS.enc.Base64.parse($.data.chapterInfo.content)}), key, {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.NoPadding}).toString(CryptoJS.enc.Utf8);
  return {
    data: {
      finalUrl: response.finalUrl,
      body: body.replaceAll('###$$$', '<br>'),
    },
  };
}
