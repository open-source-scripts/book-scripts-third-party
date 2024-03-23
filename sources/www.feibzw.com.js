// ==UserScript==
// @name          飞速中文
// @domain        www.feibzw.com
// @version       1.0.0
// @icon          https://www.feibzw.com/favicon.ico
// @supportURL    https://github.com/open-source-scripts/book-scripts-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==

async function search(keyword, opaque) {
  let resp = await fetch(`https://www.feibzw.com/book/search.aspx?SearchKey=${await Codec.encodeURIComponent(keyword, 'gbk')}&SearchClass=1&SeaButton=`, {
    responseType: 'bytes',
  });
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(await Codec.decode(resp.data, 'gbk'));
  let items = doc.querySelectorAll('div.book');
  let currPage = doc.querySelector("td.paginator font:nth-child(2)").text;
  let nextPage = doc.querySelector("td.paginator font:nth-child(3)").text;
  return {
    data: {
      data: items.map((item) => {
        return {
          id: item.querySelector('div > a').getAttribute('href').match(/Html\/(\d+)\/index.html/)[1],
          name: item.querySelector('div > a').text,
          author: item.querySelector('div:nth-of-type(1)').text.match(/\[\s?(.*?)\s?\|/)[1],
          category: item.querySelector('div:nth-of-type(1)').text.match(/\|\s?(.*?)\s?\|/)[1],
          intro: item.querySelector('div#CListText').text,
          // cover: item.querySelector('a > img').getAttribute('data-src'),
          // updateTime: item.querySelector('div:nth-of-type(1)').text.match(/最新章节 >>>.*\|\s?(.*?)\s?更新\s?\]/)[1], // 更新日期
          lastChapterName: item.querySelector('div:nth-of-type(1)').text.match(/最新章节 >>>\s?(.*?)\s?\|/)[1],
          // status: item.querySelector('div.labelbox label:nth-of-type(2)').text === '完本' ? 1 : 0, // 状态: 0: 连载; 1: 完本; 2: 断更;
        };
      }),
    },
  };
}

async function detail(id) {
  let resp = await fetch(`https://www.feibzw.com/Html/${id}/index.html`, {
    responseType: 'bytes',
  });
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(await Codec.decode(resp.data, 'gbk'));
  let bookBox = doc.querySelector('.bookinfo');
  return {
    code: 0,
    message: 'success',
    // 书籍数据
    data: {
      id: id,
      name: bookBox.querySelector('.info > p > a').text,
      author: bookBox.querySelector('.info > p > span').text.replace("文 / ",""),
      // category: bookBox.querySelector('.booknav2 p:nth-of-type(2) a').text,
      intro: doc.querySelector('.intro').text,
      cover: bookBox.querySelector('.bookimg a img').getAttribute('src'),
      words: parseInt(bookBox.querySelector('.info > p:nth-of-type(2)').text.match(/总字数：(\d+) 总推荐/)[1]),
      updateTime: Date.parseWithFormat(bookBox.querySelector('.info > p:nth-of-type(2)').text.match(/更新时间：(.+)/)[1], 'yyyy-M-d HH:mm:ss'), // 更新日期
      lastChapterName: doc.querySelector('.intro p:last-of-type a').text,
      // status: bookBox.querySelector('.booknav2 p:nth-of-type(3)').text.includes('连载') ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更;
    },
  };
}

async function toc(id) {
  let resp = await fetch(`https://www.feibzw.com/Html/${id}/index.html`, {
    responseType: 'bytes',
  });
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(await Codec.decode(resp.data, 'gbk'));
  let items = doc.querySelectorAll('.chapterlist ul li a');
  return {
    data: items.map((item) => {
      return {
        name: item.text,
        id: item.getAttribute('href').match(/(\d+)\.html/)[1],
        url: item.getAttribute('href'),
      };
    }),
  };
}

async function chapter(bid, cid) {
  let chapterUrl = `https://www.feibzw.com/Html/${bid}/${cid}.html`;
  let resp = await fetch(chapterUrl, {
    responseType: 'bytes',
  });
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(await Codec.decode(resp.data, 'gbk'));
  let txtnav = doc.querySelector('#content');
  txtnav.querySelectorAll('p.l').map((item) => {
    item.remove();
  });
  txtnav.querySelectorAll('audio').map((item) => {
    item.remove();
  });
  let chapterText = txtnav.innerHtml;
  chapterText = chapterText.replace("飞速中文.com 中文域名一键直达","");
  return {
    data: {
      finalUrl: chapterUrl,
      body: chapterText,
    },
  };
}