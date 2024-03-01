// ==UserScript==
// @name          爱青果
// @domain        api-new.iqingguo.com
// @homepage      https://iqingguo.com
// @version       1.0.2
// @icon          https://iqingguo.com/favicon.ico
// @supportUrl    https://github.com/open-source-scripts/book-scripts-third-party/issues
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
        {
          key: '男生', value: 0, child: {
            children: [
              {key: '玄幻', value: 1},
              {key: '都市', value: 2},
              {key: '仙侠', value: 3},
              {key: '科幻', value: 4},
              {key: '奇幻', value: 5},
              {key: '武侠', value: 6},
              {key: '军史', value: 7},
              {key: '悬疑', value: 8},
              {key: '游戏', value: 9},
              {key: '体育', value: 10},
              {key: '现实', value: 11},
            ],
          },
        },
        {
          key: '女生', value: 1, child: {
            children: [
              {key: '古代言情', value: 13},
              {key: '现代言情', value: 14},
              {key: '玄幻言情', value: 15},
              {key: '仙侠奇缘', value: 16},
              {key: '青春纯爱', value: 17},
              {key: '游戏竞技', value: 18},
            ],
          },
        },
        {
          key: '二次元', value: 2, child: {
            children: [
              {key: '同人衍生', value: 20},
              {key: '原生幻想', value: 21},
              {key: '青春日常', value: 22},
              {key: '搞笑吐槽', value: 23},
              {key: '变身入替', value: 24},
              {key: '唯美幻想', value: 25},
            ],
          },
        },
      ],
    },
  };
}

async function category(categories, opaque) {
  let type = categories[1];
  let page = opaque ? opaque.page : 1;
  let response = await fetch(`https://api-new.iqingguo.com/apiv1/book/index`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    data: `bigcate=${type}&order=0&page=${page}`,
  });
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = JSON.parse(response.data);
  if ($.code !== 0) {
    throw new SourceError(`${$.msg}(${$.code})`);
  }
  return {
    data: {
      data: $.data.list.map((e) => ({
        id: e.id,
        name: e.title,
        author: e.author,
        authorId: e.authorid,
        category: e.cate.catename,
        tags: e.label ? e.label : null,
        intro: e.remark,
        cover: e.coverpic,
        words: parseInt(e.words),
        updateTime: new Date(parseInt(e.update_time) * 1000), // 更新日期
        status: $.data.iswz === '1' ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更;
      })),
      hasMore: page < $.data.totalpages,
      opaque: {
        page: ++page,
      },
    },
  };
}

async function search(keyword, opaque) {
  let page = opaque ? opaque.page : 1;
  let response = await fetch(`https://api-new.iqingguo.com/apiv1/book/search`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    data: `keyword=${keyword}&page=${page}`,
  });
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = JSON.parse(response.data);
  if ($.code !== 0) {
    throw new SourceError(`${$.msg}(${$.code})`);
  }
  return {
    data: {
      data: $.data.list.map((e) => {
        return {
          id: e.id,
          name: e.title,
          author: e.author,
          authorId: e.authorid,
          category: e.cate.catename,
          tags: e.label ? e.label : null,
          intro: e.remark,
          cover: e.coverpic,
          words: parseInt(e.words),
          updateTime: new Date(parseInt(e.update_time) * 1000), // 更新日期
          status: $.data.iswz === '1' ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更; 
        };
      }),
      hasMore: page < $.data.totalpages,
      opaque: {
        page: ++page,
      },
    },
  };
}

async function detail(id) {
  let response = await fetch(`https://api-new.iqingguo.com/apiv1/book/detail`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    data: `bid=${id}`,
  });
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = JSON.parse(response.data);
  if ($.code !== 0) {
    throw new SourceError(`${$.msg}(${$.code})`);
  }
  return {
    data: {
      id: $.data.id,
      name: $.data.title,
      author: $.data.author,
      authorId: $.data.authorid,
      category: $.data.cate.catename,
      tags: $.data.label ? $.data.label : null,
      intro: $.data.remark,
      cover: $.data.coverpic,
      words: parseInt($.data.words),
      updateTime: new Date(parseInt($.data.update_time) * 1000), // 更新日期
      status: $.data.iswz === '1' ? 0 : 1, // 状态: 0: 连载; 1: 完本; 2: 断更; 
    },
  };
}

async function toc(id) {
  let response = await fetch(`https://api-new.iqingguo.com/apiv1/book/chapter`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    data: `bid=${id}`,
  });
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = JSON.parse(response.data);
  if ($.code !== 0) {
    throw new SourceError(`${$.msg}(${$.code})`);
  }
  return {
    data: $.data.map((e) => {
      return {id: e.id, name: e.title};
    }),
  };
}

async function chapter(bid, cid) {
  let response = await fetch(`https://api-new.iqingguo.com/apiv1/book/chapterdetail`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    data: `sid=${cid}`,
  });
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = JSON.parse(response.data);
  if ($.code !== 0) {
    throw new SourceError(`${$.msg}(${$.code})`);
  }
  return {
    data: {
      finalUrl: response.finalUrl,
      body: $.data.content,
    },
  };
}
