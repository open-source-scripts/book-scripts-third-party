// ==UserScript==
// @name          企鹅听书
// @domain        pub.ddrd8.com
// @version       1.0.1
// @supportURL    https://github.com/open-source-scripts/book-scripts-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==

async function search(keyword, opaque) {
  let resp = await fetch(`http://pub.ddrd8.com/search/result?query=${keyword}&language=zh_cn`);
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let jsonData = JSON.parse(resp.data).books;
  let result = [];
  for (let item of jsonData) {
    result.push({
      id: item._id,
      name: item.bookName,
      author: item.authorName,
      cover: item.cover,
      category: item.bigCate + '-' + item.subCate,
      words: item.word,
      intro: item.intro,
    });
  }
  return {
    data: {
      data: result,
      hasMore: false,
    },
  };
}

async function detail(id) {
  let resp = await fetch(`http://pub.ddrd8.com/info/${id}?language=zh_cn`);
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let jsonData = JSON.parse(resp.data);
  return {
    data: {
      id: jsonData._id,
      name: jsonData.bookName,
      author: jsonData.authorName,
      intro: jsonData.intro,
      updateTime: Date.parseWithFormat(jsonData.updateTime, 'yyyy-MM-dd HH:mm:ss'),
      lastChapterName: jsonData.lastChapter,
      status: jsonData.isEnd === 1 ? 1 : 0,
      tags: jsonData.tags,
      category: jsonData.bigCate + '-' + jsonData.subCate,
      words: jsonData.word,
      cover: jsonData.cover,
    },
  };
}

async function toc(id) {
  let resp = await fetch(`http://pub.ddrd8.com/chapters/${id}?view=chapters&appName=com.ddyd.nbsdbxyh&https=1&language=zh_cn`);
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let jsonData = JSON.parse(resp.data);
  let result = [];
  for (let item of jsonData.chapterCon.chapterList) {
    result.push({
      name: item.title,
      id: item.link,
      url: item.link,
    });
  }
  return {
    data: result,
  };
}

async function chapter(bid, cid) {
  let resp = await fetch(cid);
  if (resp.status !== 200) {
    throw new NetworkError(resp.status);
  }
  let jsonData = JSON.parse(resp.data);
  return {
    data: {
      finalUrl: cid,
      body: jsonData.chapter.body,
    },
  };
}
