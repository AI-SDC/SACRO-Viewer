const siteData = JSON.parse(document.getElementById("filesData").textContent);

const contentUrls = new Map(Object.entries(siteData.content_urls));
const outputs = new Map(Object.entries(siteData.outputs));
const reviewUrl = siteData.review_url;

export { contentUrls, outputs, reviewUrl };
