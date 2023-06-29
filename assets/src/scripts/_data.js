const siteData = JSON.parse(document.getElementById("filesData").textContent);

const outputs = new Map(Object.entries(siteData.outputs));
const reviewUrl = siteData.review_url;

export { outputs, reviewUrl };
