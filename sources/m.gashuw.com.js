// ==UserScript==
// @name          歌书小说
// @domain        m.gashuw.com
// @version       1.0.0
// @supportURL    https://github.com/open-source-scripts/book-scripts-third-party/issues
// @function      search
// @function      detail
// @function      toc
// @function      chapter
// ==/UserScript==

const baseUrl = 'http://m.gashuw.com'

async function search(keyword, opaque) {
    let resp = await fetch(`${baseUrl}/s.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: `keyword=${encodeURIComponent(keyword)}&t=1`
    })
    if (resp.status !== 200) {
        throw new NetworkError(resp.status);
    }
    let doc = new Document(resp.data);
    return {
        data: {
            data: doc.querySelectorAll("div.hot_sale")?.map((item) => {
                let id = item.querySelector("a").getAttribute("href").match(/\d+/)[0];
                let authorItems = item.querySelectorAll('p.author').map((authorItem) => {
                    return authorItem.ownText
                })
                return {
                    id: id,
                    cover: `http://image.gashuw.com/${id.substring(0, 2)}/${id}/${id}s.jpg`,
                    name: item.querySelector('p.title').text,
                    author: authorItems[0].split('|')[1].trim().replace('作者：', ''),
                    category: authorItems[0].split('|')[0].trim(),
                    lastChapterName: authorItems[1].split('|')[1].trim(),
                    status: authorItems[1].split('|')[0].trim() === "连载" ? 1 : 0,
                }
            }),
            hasMore: false,
        }
    }
}

async function detail(id) {
    let resp = await fetch(`${baseUrl}/biquge_${id}/`)
    if (resp.status !== 200) {
        throw new NetworkError(resp.status);
    }
    let doc = new Document(resp.data);
    console.log(resp.data)
    let detail = doc.querySelector(".synopsisArea_detail")
    return {
        data: {
            id: id,
            name: doc.querySelector(".title").text,
            author: detail.querySelector(".author").text.replace("坐着：", ""),
            category: detail.querySelector(".sort").text.replace("类别：", ""),
            intro: doc.querySelector(".review").text,
            cover: detail.querySelector("img").getAttribute("src"),
            updateTime: Date.parseWithFormat(detail.querySelector("p:last-child").text.replace("更新：", "").trim(), "yyyy-MM-dd"),
            lastChapterName: doc.querySelector(".directoryArea p").text,
            status: detail.querySelector("p:nth-child(4)").text.replace("状态：", "") === "连载中" ? 1 : 0,
        }
    }
}

async function toc(id) {
    let pageIndex = 1;
    let dataSlice = [];
    while (true) {
        let resp = await fetch(`http://m.gashuw.com/biquge_${id}/${pageIndex}/`);
        let uri = Uri.parse(resp.finalUrl);
        if (resp.status !== 200) {
            throw new NetworkError(resp.status);;
        }
        let doc = new Document(resp.data);
        let chapterList = doc.querySelectorAll(".directoryArea p");
        for (let index = 5; index < chapterList.length; index++) {
            let item = chapterList[index];
            let url = item.querySelector("a").getAttribute("href");
            dataSlice.push({
                id: url.match(/\/(\d+)/)[1],
                name: item.text,
                url: uri.resolve(url).toString(),
            });
        }
        pageIndex++;
        if (doc.querySelector(".right a").getAttribute("disabled") == "disabled") {
            break
        }
    }
    return {
        data: dataSlice,
    };
}

async function chapter(bid, cid) {
    let pageIndex = 1;
    let finalUrl = "";
    let contentText = "";
    while (true) {
        let resp = await fetch(`http://m.gashuw.com/biquge_${bid}/${cid}_${pageIndex}.html`)
        if (resp.status !== 200) {
            throw new NetworkError(resp.status);;
        }
        if(finalUrl != ""){
            finalUrl = resp.finalUrl;
        }
        let doc = new Document(resp.data);
        let content = doc.querySelector("#chaptercontent");
        console.log(content.text);
        content.querySelector("#content_tip")?.remove();
        content.querySelector("#content_tip")?.remove();
        contentText += content.innerHtml;
        pageIndex++;
        if (doc.querySelector("#pt_next").text !== "下一页") {
            break
        }
    }
    contentText = contentText.replaceAll("本章未完，点击下一页继续阅读<br>","")
    contentText = contentText.replaceAll("<br><br>本章未完，点击下一页继续阅读","")
    contentText = contentText.replaceAll("本章未完，点击下一页继续阅读","")
    contentText = contentText.replaceAll("歌书网_www.gashuw.com","")
    contentText = contentText.replaceAll("最新网址：m.gashuw.com","")
    console.log(contentText)
    return {
        data: {
            finalUrl: finalUrl,
            body: contentText,
        }
    }
}