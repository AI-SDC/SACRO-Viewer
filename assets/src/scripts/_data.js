const siteData = JSON.parse(document.getElementById("filesData").textContent);
const reviewUrl = siteData.review_url;
const contentUrls = new Map(Object.entries(siteData.content_urls));

export { reviewUrl, contentUrls };
