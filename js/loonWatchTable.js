import { capitalize } from './utils.js';
import { fetchOccupied, fetchSurveyed, fetchCombined } from './loonWatchData.js';
var uiHost = location.protocol + "//" + location.host;

export async function loonTownTableHtml(townName, strQryParams='') {
    townName = capitalize(townName);
    let search = `townName=${townName}`;
    let lwJson = await fetchCombined(search);
    console.log(`loonTownTable(${townName},${strQryParams}) | fetchCombined:`, lwJson);
    let htmTbl = '';
    let htmTtl = '';
    let hasData = false;
    if (lwJson.rowCount && lwJson.rows[0].wbtextid) {
      htmTbl = '';
      htmTbl += `<tr><th>Name</th><th>Area</th><th>Surveyed</th><th>Occupied</th></tr>`;
      for (const row of lwJson.rows) {
        let lakeArea = row.wbarea ? row.wbarea : '';
        if (row.lakeName) {
          let lastSurveyed = row.lastSurveyed ? row.lastSurveyed : '';
          let lastOccupied = row.lastOccupied ? row.lastOccupied : '';
          hasData = hasData ? hasData : row.lastSurveyed;
          htmTbl += `<tr><td><a href="${uiHost}/chart.html?townName=${townName}&LAKEID=${row.wbtextid}">${row.lakeName}</a></td><td>${lakeArea}</td><td>${lastSurveyed}</td><td>${lastOccupied}</td></tr>`
        } else {
          htmTbl += `<tr><td><a href="${uiHost}?LAKEID=${row.wbtextid}${strQryParams ? '&'+strQryParams : ''}">${row.wbtextid}</a></td><td>${lakeArea}</td><td></td><td></td></tr>`;
        }
      }
      if (hasData) {htmTtl = `<u>Town of <b><a href="${uiHost}/chart.html?townName=${townName}">${townName}</a></b> Water Bodies</u>:`;}
      else {htmTtl = `<u>Town of <b>${townName}</b> Water Bodies</u>:`;}
    } else {
      htmTtl = `<u>Town of <b>${townName}</b></u> has no water bodies.`;
    }
    return ({title:htmTtl, table:htmTbl});
}
  