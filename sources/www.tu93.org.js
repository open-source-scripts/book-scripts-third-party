// ==UserScript==
// @name          兔九三
// @domain        www.tu93.org
// @version       1.0.0
// @supportURL    https://github.com/open-source-scripts/book-scripts-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==

const baseUrl = 'https://www.tu93.org'

async function search(keyword, opaque) {
  let homeHtmlResp = await fetch(baseUrl, {
    method: 'GET',
    headers: {
      'User-Agent': UserAgents.android,
    },
  });
  let homeDoc = new Document(homeHtmlResp.data);
  let token = homeDoc.querySelector("input[name='_token']").getAttribute("value");
  let resp = await fetch(`${baseUrl}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UserAgents.android,
    },
    data: `_token=${token}&keyword=${encodeURIComponent(keyword)}`
  })
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(resp.data);
  return {
    data: {
      data: doc.querySelectorAll("div.col-md-10")?.map((item) => {
        let id = item.querySelector(".bookTitle a").getAttribute("href").match(/book\/(\d+)/)[1];
        return {
          id: id,
          cover: `https://img.tu93.org/${id.substring(0, 2)}/${id}/${id}s.jpg`,
          name: item.querySelector('.bookTitle').text,
          author: item.querySelector('.booktag').text,
          intro: item.querySelector('#bookIntro').text,
          lastChapterName: item.querySelector('p:nth-child(5) a').text
        }
      }),
      hasMore: false,
    }
  }
}

async function detail(id) {
  let resp = await fetch(`${baseUrl}/book/${id}.html`, {
    method: 'GET',
    headers: {
      'User-Agent': UserAgents.android,
    },
  });

  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(resp.data);
  let bookBox = doc.querySelector('.panel-body');
  let lastChapter = doc.querySelector('.panel-body p:nth-of-type(3)')
  return {
    code: 0,
    message: 'success',
    // 书籍数据
    data: {
      id: id,
      name: bookBox.querySelector('h1').text,
      author: bookBox.querySelector('.booktag > a').text,
      category: bookBox.querySelector('.booktag a:nth-of-type(2)').text,
      intro: bookBox.querySelector('#bookIntro').text,
      cover: bookBox.querySelector('#bookIntro img').getAttribute('src'),
      words: bookBox.querySelector('.booktag > span:nth-of-type(1)').text.match(/\d*\.?\d*/)[0] * 10000,
      lastChapterName: lastChapter.querySelector('a').text,
      status: bookBox.querySelector('.booktag > span:nth-of-type(3)').text.includes('连载') ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更;
    },
  };
}

async function toc(id) {
  let resp = await fetch(`${baseUrl}/book/${id}.html`, {
    method: 'GET',
    headers: {
      'User-Agent': UserAgents.android,
    },
  });
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(resp.data);
  let items = doc.querySelectorAll('#list-chapterAll dl.panel-chapterlist dd a');
  return {
    data: items.map((item) => {
      return {
        name: item.text,
        id: item.getAttribute('href').match(/book\/(\d+)\/(\d+)/)[2],
        url: item.getAttribute('href'),
      };
    }),
  };
}

async function chapter(bid, cid) {
  let chapterUrl = `${baseUrl}/book/${bid}/${cid}.html`;
  let resp = await fetch(chapterUrl, {
    method: 'GET',
    headers: {
      'User-Agent': UserAgents.android,
    },
  });
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(resp.data);
  let txtnav = doc.querySelector('#htmlContent');
  let replaceContent = txtnav.innerHtml.replace(/<a.+完整章节\)<\/p>/, '');
  replaceContent = replaceContent.replace(/<p class="pmore".+\<\/p>/, '');
  replaceContent = replaceContent.replace("<p>「如章节缺失请退#出#阅#读#模#式」</p>", "")
  return {
    data: {
      finalUrl: chapterUrl,
      body: replaceContent,
    },
  };
}