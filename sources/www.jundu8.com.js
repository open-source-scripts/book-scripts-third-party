// ==UserScript==
// @name          铅笔小说
// @domain        www.jundu8.com
// @version       1.0.0
// @icon          http://www.jundu8.com/favicon.ico
// @supportURL    https://github.com/open-source-scripts/book-scripts-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==

async function search(keyword, opaque) {
  let resp = await fetch(`http://www.jundu8.com/search67.html?searchkey=${encodeURIComponent(keyword)}`)
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(resp.data);
  return {
    data: {
      data: doc.querySelectorAll("#main #hotcontent .item")?.map((item) => {
        let id = item.querySelector("a").getAttribute("href").match(/\d+/)[0];
        return {
          id: id,
          cover: item.querySelector("img").getAttribute("data-original"),
          name: item.querySelector("dl dt a").text,
          author: item.querySelector("dl .btm a").text,
          intro: item.querySelector("dl dd").text.replace("简介:", ""),
          words: item.querySelector("dl .btm em:nth-of-type(1)").text.replace("万字", "") * 10000,
        }
      }),
    }
  }
}

async function detail(id) {
  let resp = await fetch(`http://www.jundu8.com/book/${id}/`)
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(resp.data);
  let detail = doc.querySelector("#maininfo")
  let info = detail.querySelector("#info")
  return {
    data: {
      id: id,
      name: info.querySelector("h1").text,
      author: info.querySelector("p:nth-of-type(1) a").text,
      intro: detail.querySelector("#intro").text,
      cover: detail.querySelector("img").getAttribute("data-original"),
      words: info.querySelector("p:nth-of-type(3)").text.replace("字数：", "").replace("万字", "") * 10000,
      updateTime: Date.parseWithFormat(info.querySelector("p:nth-of-type(7)").text.replace("最后更新：", ""), 'yyyy-MM-dd HH:mm:ss'),
      lastChapterName: info.querySelector("p:nth-of-type(6) a").text,
      status: info.querySelector("p:nth-of-type(4)").text.concat("连载") ? 0 : 1,
    }
  }
}

async function toc(id) {
  let resp = await fetch(`http://www.jundu8.com/read/${id}/`)
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let doc = new Document(resp.data);
  return {
    data: doc.querySelectorAll("#content_1 a")?.map((item) => {
      return {
        id: item.getAttribute("href").match(/\/book\/\d+\/(\d+)/)[1],
        name: item.text,
        url: item.getAttribute("href"),
      }
    }),
  }
}

async function chapter(bid, cid) {
  let content = "";
  let pageIndex = 1;
  for (let i = 0; i < 3; i++) {
    let resp = await fetch(`http://www.jundu8.com/book/${bid}/${cid}_${pageIndex}.html`)
    if (resp.status !== 200) {
      throw new NetworkError(resp.status);
    }
    let doc = new Document(resp.data);
    let contentText = doc.querySelector("#booktxt")
    if (contentText) {
      content += contentText.innerHtml;
      pageIndex++;
    } else {
      break;
    }
  }
  return {
    data: {
      body: content,
      finalUrl: `http://www.jundu8.com/book/${bid}/${cid}.html`,
    }
  }
}