import { capitalize } from './utils.js';
import { fetchCombined } from './loonWatchData.js';
import { parseURLParams } from './loonWatchChart.js';
var uiHost = location.protocol + "//" + location.host;
var uiPage = location.pathname;

let tblEle = document.getElementById('chartTbl');
let lblEle = document.getElementById('tableLbl');

//on startup, parse query params and display
const reqQry = new URLSearchParams(window.location.search);
if (reqQry.get('countyName')) {loonCountyTable(reqQry.get('countyName'));}
if (reqQry.get('townName')) {loonTownTable(reqQry.get('townName'));}
if (reqQry.get('lakeName')) {loonLakeTable(reqQry.get('lakeName'));}


//on message, parse query params and re-display
window.addEventListener("message", e => {
  if ('loonwatch-search'==e.data.source || 'loonwatch-map'==e.data.source) {
    tblEle.innerHTML = ''; lblEle.innerHTML = '';
    console.log('loonWatchTable.js received message', e.data);
    let objQry = e.data.params;
    if (objQry.countyName) {loonCountyTable(objQry.countyName);}
    if (objQry.townName) {loonTownTable(objQry.townName);}
    if (objQry.lakeName) {loonLakeTable(objQry.lakeName);}
  }
})

export async function loonCountyTable(countyName, tbl=tblEle, lbl=lblEle) {
  console.log('loonWatchTable=>loonCountyTable', countyName);
  //let objHtml = await loonCountyTableHtml(countyName);
  if (tbl) {tbl.innerHTML = `Not built yet`;}
  if (lbl) {lbl.innerHTML = ``;}
}
export async function loonTownTable(townName, tbl=tblEle, lbl=lblEle) {
  console.log('loonWatchTable=>loonTownTable', townName);
  let objHtml = await loonTownTableHtml(townName);
  if (tbl) {tbl.innerHTML = objHtml.table;}
  if (lbl) {lbl.innerHTML = objHtml.title;}
}
export async function loonLakeTable(lakeName, tbl=tblEle, lbl=lblEle) {
  console.log('loonWatchTable=>loonLakeTable', lakeName);
  //let objHtml = await loonLakeTableHtml(lakeName);
  if (tbl) {tbl.innerHTML = `Not built yet`;}
  if (lbl) {lbl.innerHTML = ``;}
}

export async function loonTownTableHtml(townName, strQryParams='') {
  townName = capitalize(townName);
  let search = `townName=${townName}`;
  let lwJson = await fetchCombined(search);
  console.log(`loonTownTable(${search},${strQryParams}) | fetchCombined:`, lwJson);
  let htmTbl = '';
  let htmTtl = '';
  let hasData = false;
  if (lwJson.rowCount && lwJson.rows[0].wbtextid) {
    htmTbl = '';
    htmTbl += `<tr><th>Name</th><th>Area</th><th>Surveyed</th><th>Occupied</th></tr>`;
    for (const row of lwJson.rows) {
      let lakeArea = row.gisacres ? row.gisacres.toFixed(1) : '';
      if (row.lakeName) {
        let lastSurveyed = row.lastSurveyed ? row.lastSurveyed : '';
        let lastOccupied = row.lastOccupied ? row.lastOccupied : '';
        hasData = hasData ? hasData : row.lastSurveyed;
        htmTbl += `<tr><td><a href="${uiHost}${uiPage}?townName=${townName}&LAKEID=${row.wbtextid}">${row.lakeName}</a></td><td>${lakeArea}</td><td>${lastSurveyed}</td><td>${lastOccupied}</td></tr>`
      } else {
        htmTbl += `<tr><td><a href="${uiHost}${uiPage}?LAKEID=${row.wbtextid}${strQryParams ? '&'+strQryParams : ''}">${row.wbtextid}</a></td><td>${lakeArea}</td><td></td><td></td></tr>`;
      }
    }
    if (hasData) {htmTtl = `<u>Town of <b><a href="${uiHost}${uiPage}?townName=${townName}">${townName}</a></b> Water Bodies</u>:`;}
    else {htmTtl = `<u>Town of <b>${townName}</b> Water Bodies</u>:`;}
  } else {
    htmTtl = `<u>Town of <b>${townName}</b></u> has no water bodies.`;
  }
  return ({title:htmTtl, table:htmTbl});
}
  