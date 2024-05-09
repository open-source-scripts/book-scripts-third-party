// ==UserScript==
// @name          69书吧
// @domain        www.69shuba.com
// @version       1.0.2
// @supportURL    https://github.com/open-source-scripts/book-scripts-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==

const host = 'https://www.69shuba.pro'

async function search(keyword, opaque) {
  let resp = await fetch(`${host}/modules/article/search.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UserAgents.macos,
    },
    data: `searchkey=${await Codec.encodeURIComponent(keyword, 'gbk')}&searchtype=all`,
  });
  if (resp.status !== 200) {
    throw new NetworkError(resp.status, 'Network error! try use proxy');
  }
  let doc = new Document(resp.data);
  let items = doc.querySelectorAll('div.newbox > ul > li');
  return {
    data: {
      data: items.map((item) => {
        return {
          id: item.querySelector('a').getAttribute('href').match(/book\/(\d+).htm/)[1],
          name: item.querySelector('h3').text,
          author: item.querySelector('div.labelbox > label').text,
          category: item.querySelector('div.labelbox label:nth-of-type(2)').text,
          intro: item.querySelector('.ellipsis_2').text,
          cover: item.querySelector('a > img').getAttribute('data-src'),
          updateTime: Date.parseWithFormat(item.querySelector('.zxzj span:nth-of-type(1)').text, 'yyyy-MM-dd'), // 更新日期
          lastChapterName: item.querySelector('.zxzj p').text.replace('最近章节', ''),
          status: item.querySelector('div.labelbox label:nth-of-type(2)').text === '完本' ? 1 : 0, // 状态: 0: 连载; 1: 完本; 2: 断更;
        };
      }),
    },
  };
}

async function detail(id) {
  let resp = await fetch(`${host}/book/${id}.htm`, {
    responseType: 'bytes',
  });
  if (resp.status !== 200) {
    throw new NetworkError(resp.status, 'Network error! try use proxy');
  }
  let doc = new Document(await Codec.decode(resp.data, 'gbk'));
  let bookBox = doc.querySelector('.bookbox');
  return {
    code: 0,
    message: 'success',
    // 书籍数据
    data: {
      id: id,
      name: bookBox.querySelector('.booknav2 h1').text,
      author: bookBox.querySelector('.booknav2 p:nth-of-type(1) a').text,
      category: bookBox.querySelector('.booknav2 p:nth-of-type(2) a').text,
      intro: doc.querySelector('.navtxt').text,
      cover: bookBox.querySelector('.bookimg2 img').getAttribute('src'),
      words: bookBox.querySelector('.booknav2 p:nth-of-type(3)').text.match(/[1-9]\d*.\d*|0.\d*[1-9]\d*/)[0] * 10000,
      updateTime: Date.parseWithFormat(bookBox.querySelector('.booknav2 p:nth-of-type(4)').text.replace('更新：', ''), 'yyyy-MM-dd'), // 更新日期
      lastChapterName: doc.querySelector('.qustime > ul > li > a > span').text,
      status: bookBox.querySelector('.booknav2 p:nth-of-type(3)').text.includes('连载') ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更;
    },
  };
}

async function toc(id) {
  let resp = await fetch(`${host}/book/${id}/`, {
    responseType: 'bytes',
  });
  if (resp.status !== 200) {
    throw new NetworkError(resp.status, 'Network error! try use proxy');
  }
  let doc = new Document(await Codec.decode(resp.data, 'gbk'));
  let items = doc.querySelectorAll('#catalog > ul > li > a');
  return {
    data: items.map((item) => {
      return {
        name: item.text,
        id: item.getAttribute('href').match(/txt\/(\d+)\/(\d+)/)[2],
        url: item.getAttribute('href'),
      };
    }),
  };
}

async function chapter(bid, cid) {
  let chapterUrl = `${host}/txt/${bid}/${cid}`;
  let resp = await fetch(chapterUrl, {
    responseType: 'bytes',
  });
  if (resp.status !== 200) {
    throw new NetworkError(resp.status, 'Network error! try use proxy');
  }
  let doc = new Document(await Codec.decode(resp.data, 'gbk'));
  let txtnav = doc.querySelector('.txtnav');
  txtnav.querySelectorAll('.hide720').map((item) => {
    item.remove();
  });
  txtnav.querySelectorAll('.txtright').map((item) => {
    item.remove();
  });
  return {
    data: {
      finalUrl: chapterUrl,
      body: txtnav.innerHtml,
    },
  };
}