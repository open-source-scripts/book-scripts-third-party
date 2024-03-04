// ==UserScript==
// @name          深夜看书
// @domain        shenyebook.com
// @homepage      www.shenyebook.com
// @version       1.0.0
// @supportUrl    https://github.com/open-source-scripts/book-scripts-third-party/issues
// @require       https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/crypto-js/4.1.1/crypto-js.min.js
// @function      categories
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==

const baseUrl = 'https://www.shenyebook.com';
const pageReg = /\(第(\d+)\/(\d+)页\)/;

/**
 * 分类配置
 */
function categories() {
  return {
    data: {
      children: [
        {key: '全部', value: '0'},
        {key: '‍原创‌小说', value: '3789627551813'},
        {key: '同人衍生', value: '3789627568198'},
        {key: '耽美', value: '3468358279237'},
        {key: '言情', value: '3468358291526'},
        {key: '同人', value: '3468358336585'},
        {key: '综合', value: '3468360114248'},
        {key: 'PO18', value: '3843818709061'},
        {key: '古言', value: '12194619924552'},
        {key: '现言', value: '12194619514950'},
        {key: '都市', value: '12194619465798'},
        {key: '科幻', value: '12194619387973'},
        {key: '玄幻', value: '12194619539526'},
        {key: '仙侠', value: '12194619486278'},
        {key: '轻小说', value: '12194619441222'},
        {key: '幻情', value: '12194619592774'},
        {key: '游戏 ', value: '12194619478086'},
        {key: '历史', value: '12194619564103'},
        {key: '悬疑', value: '12194619699270'},
        {key: '青春', value: '12194619846726'},
        {key: '现实', value: '12194620330054'},
        {key: '武侠', value: '12194619519048'},
        {key: '体育', value: '12194619605064'},
        {key: '奇幻 ', value: '12194619560008'},
        {key: '军事', value: '12194620354630'},
        {key: '短篇', value: '12194619932744'},
        {key: '其它分类', value: '12194628931656'},
        {key: '纯爱', value: '12194683387974'},
      ],
    },
  };
}

/**
 * 分类
 * @param {Object} categories 选中的分类配置
 * @param {Object} opaque 透传数据
 * @return {Object} 返回书籍列表数据
 */
async function category(categories, opaque) {
  let category = categories[0];
  let page = opaque ? opaque.page : 1;
  let response = await fetch(`${baseUrl}/category/${category}/${page}.html`);
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = new Document(response.data);
  let selections = $.querySelector('.CGsectionTwo-right-bottom-detail')?.text?.match(pageReg);
  let totalPage = !!selections ? Number(selections[2]) : 0;
  return {
    data: {
      data: $.querySelectorAll('.CGsectionTwo-right-content-unit').map((item) => {
        let nameElement = item.querySelector('.title');
        let authorElement = item.querySelector('.b');
        let categoryElementText = item.querySelector('p:nth-child(3)').text;
        let updateTimeText = item.querySelector('p:nth-child(4)').text.replace('最近更新 ', '');
        return {
          id: nameElement.getAttribute('href').split('/')[2],
          name: nameElement.text,
          author: authorElement.text,
          authorId: authorElement.getAttribute('href').split('/')[2],
          intro: categoryElementText,
          updateTime: Date.parseWithFormat(updateTimeText, 'yyyy-MM-dd'),
        };
      }),
      hasMore: page < totalPage,
      opaque: {
        opaque: {page: page + 1},
      },
    },
  };
}

/**
 * 搜索
 * @param keyword {String} 关键字
 * @param opaque {Object} 透传数据
 * @return {Object} 返回书籍列表数据
 */
async function search(keyword, opaque) {
  let page = opaque ? opaque.page : 1;
  let response = await fetch(`${baseUrl}/search/${keyword}/${page}`);
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = new Document(response.data);
  let selections = $.querySelector('.CGsectionTwo-right-bottom-detail')?.text?.match(pageReg);
  let totalPage = !!selections ? Number(selections[2]) : 0;
  return {
    data: {
      data: $.querySelectorAll('.SHsectionThree-middle p')?.map((item) => {
        let nameElement = item.querySelector('span:nth-child(2) a');
        let authorElement = item.querySelector('span:nth-child(3) a');
        let id = nameElement.getAttribute('href').split('/')[2];
        let authorId = authorElement.getAttribute('href').split('/')[2];
        return {
          id: id,
          name: nameElement.text,
          author: authorElement.text,
          authorId: authorId,
          category: item.querySelector('span:nth-child(1) a').text,
        };
      }),
      hasMore: page < totalPage,
      opaque: {page: page + 1},
    },
  };
}

/**
 * 详情
 * @param {String} id 书籍ID
 * @return {Object} 返回书籍数据
 */
async function detail(id) {
  let response = await fetch(`${baseUrl}/book/${id}/`);
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = new Document(response.data);
  let authorElement = $.querySelector('.BGsectionOne-top-right .author a');
  return {
    data: {
      id: id,
      name: $.querySelector('.BGsectionOne-top-right .title').text,
      author: authorElement.text,
      authorId: authorElement.getAttribute('href').split('/')[2],
      category: $.querySelector('.BGsectionOne-top-right .category a').text,
      intro: $.querySelector('#intro > p').text,
      cover: $.querySelector('.BGsectionOne-top-left img').getAttribute('_src'),
      updateTime: Date.parseWithFormat($.querySelector('.BGsectionOne-top-right .time span').text, 'yyyy-MM-dd HH:mm:ss'),
      lastChapterName: $.querySelector('.BGsectionOne-top-right .newestChapter a').text,
    },
  };
}

/**
 * 目录
 * @param {String} id 书籍ID
 * @return {Object} 返回目录树数据
 */
async function toc(id) {
  function parseChapter(element) {
    return {
      id: element.getAttribute('href').split('/')[3].split('.')[0],
      name: element.text,
    };
  }

  let array = [];
  let response = await fetch(`${baseUrl}/book/${id}/catalog/`);
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let $ = new Document(response.data);
  array.push(...$.querySelectorAll('.BCsectionTwo-top-chapter a').map(parseChapter));

  let selections = $.querySelector('.CGsectionTwo-right-bottom-detail')?.text?.match(pageReg);
  let totalPage = !!selections ? Number(selections[2]) : 0;
  let page = 2;
  while (page <= totalPage) {
    let response = await fetch(`${baseUrl}/book/${id}/catalog/${page}.html`);
    if (response.status !== 200) {
      throw new NetworkError(response.status);
    }
    let $ = new Document(response.data);
    array.push(...$.querySelectorAll('.BCsectionTwo-top-chapter a').map(parseChapter));
    page++;
  }
  return {
    data: array,
  };
}

/**
 * 章节
 * @param {String} bid 书籍ID
 * @param {String} cid 章节ID
 * @return {Object} 返回章节数据
 */
async function chapter(bid, cid) {
  let response = await fetch(`${baseUrl}/book/${bid}/${cid}.html`, {
    headers: {'User-Agent': UserAgents.iphone},
  });
  if (response.status !== 200) {
    throw new NetworkError(response.status);
  }
  let match = response.data.match(/html\((d\(['"].+['"],\s+['"].+['"]\))\);/);
  let body;
  try { body = eval(match[1]);} catch (e) {
    body = new Document(response.data).querySelector('.RBGsectionThree-content')?.text;
  }
  return {
    data: {
      finalUrl: response.finalUrl,
      body: body,
    },
  };
}

function d(a, b) {
  b = CryptoJS.MD5(b).toString();
  let d = CryptoJS.enc.Utf8.parse(b.substring(0, 16));
  let e = CryptoJS.enc.Utf8.parse(b.substring(16));
  return CryptoJS.AES.decrypt(a, e, {iv: d, padding: CryptoJS.pad.Pkcs7}).toString(CryptoJS.enc.Utf8);
}
