async function fetchSnippet(path) {
  try {
    const req = new Request(path);
    let snip = await fetch(req);
    let text =  await snip.text();
    return text;
  } catch (err) {
    return `<div>fetchSnippet ERROR: ${err.message}</div>`;
  }
}

document.getElementById("header").innerHTML = await fetchSnippet('html/header.html');
document.getElementById("map").innerHTML = await fetchSnippet('html/map.html');