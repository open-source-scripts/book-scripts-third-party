// ==UserScript==
// @name          69书吧69shu.xyz
// @domain        www.69shu.xyz
// @version       1.0.0
// @supportURL    https://github.com/open-source-scripts/book-scripts-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==

async function search(keyword, opaque) {
  let resp = await fetch(`https://www.69shu.xyz/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UserAgents.macos,
    },
    data: `searchkey=${keyword}`,
  });
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(resp.data);
  let items = doc.querySelectorAll('div.book-coverlist');
  return {
    data: {
      data: items.map((item) => {
        return {
          id: item.querySelector('h4.name a').getAttribute('href').match(/book\/(\d+)/)[1],
          name: item.querySelector('h4.name a').text,
          author: item.querySelector('div.author').text,
          category: item.querySelector('div.status span:nth-of-type(1)').text,
          intro: item.querySelector('.intro').text,
          cover: item.querySelector('a.cover > img').getAttribute('data-src'),
          //updateTime: Date.parseWithFormat(item.querySelector('.zxzj span:nth-of-type(1)').text, 'yyyy-MM-dd'), // 更新日期
          //lastChapterName: item.querySelector('.zxzj p').text.replace('最近章节', ''),
          status: item.querySelector('div.status span:nth-of-type(2)').text === '连载' ? 1 : 0, // 状态: 0: 连载; 1: 完本; 2: 断更;
        };
      }),
    },
  };
}

async function detail(id) {
  let resp = await fetch(`https://www.69shu.xyz/book/${id}`);
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(resp.data);
  let bookBox = doc.querySelector('.book-bookinfo .panel-body');
  console.log(bookBox.querySelector('.caption-bookinfo > p span:nth-of-type(2)').text)
  return {
    code: 0,
    message: 'success',
    // 书籍数据
    data: {
      id: id,
      name: bookBox.querySelector('h1.name').text,
      author: bookBox.querySelector('.caption-bookinfo > p > a').text,
      // category: bookBox.querySelector('.booknav2 p:nth-of-type(2) a').text,
      intro: doc.querySelector('#bookIntro').text,
      cover: bookBox.querySelector('.cover img.thumbnail').getAttribute('src'),
      words: bookBox.querySelector('.caption-bookinfo > p span:nth-of-type(2)').text.match(/\d*\.?\d*/)[0] * 10000,
      // updateTime: Date.parseWithFormat(bookBox.querySelector('.booknav2 p:nth-of-type(4)').text.replace('更新：', ''), 'yyyy-MM-dd'), // 更新日期
      lastChapterName: doc.querySelector('.caption-bookinfo p:nth-of-type(3) > a').text,
      status: bookBox.querySelector('.caption-bookinfo > p span:nth-of-type(3)').text.includes('连载') ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更;
    },
  };
}

async function toc(id) {
  let bookType = id.substr(0,id.length-3)
  console.log(`https://www.69shu.xyz/index/${bookType}/${id}/1.html/`)
  let resp = await fetch(`https://www.69shu.xyz/index/${bookType}/${id}/1.html/`);
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(resp.data);
  let items = doc.querySelectorAll('dl.panel-chapterlist dd a');
  return {
    data: items.map((item) => {
      return {
        name: item.text,
        id: item.getAttribute('href').match(/read\/(\d+)\/(\d+)/)[2],
        url: item.getAttribute('href'),
      };
    }),
  };
}

async function chapter(bid, cid) {
  let chapterUrl = `https://www.69shu.xyz/read/${bid}/${cid}.html`;
  let resp = await fetch(chapterUrl);
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(resp.data);
  let txtnav = doc.querySelector('#chaptercontent');
  return {
    data: {
      finalUrl: chapterUrl,
      body: txtnav.innerHtml.replace(/<p>.+接着再看更方便。<\/p>/,''),
    },
  };
}