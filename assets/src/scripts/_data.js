const siteData = JSON.parse(document.getElementById("filesData").textContent);

const { outputs, review_url: reviewUrl } = siteData;

export { outputs, reviewUrl };
