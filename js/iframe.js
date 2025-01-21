

let fraMap = document.getElementById("map-frame");
let fraCht = document.getElementById("chart-frame");

window.addEventListener("message", e => {
    if ('loonwatch-search'==e.data.source || 'loonwatch-map'==e.data.source) {
        console.log('iframe.js received message', e.data);
        fraCht.contentWindow.postMessage(e.data);
    }
})
