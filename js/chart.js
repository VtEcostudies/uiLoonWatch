
import { loonWatchCountsChartCreate } from './loonWatchData.js';
import { loonTownTableHtml } from './loonWatchTable.js';
import { capitalize } from './utils.js';

function loonChartOnTag(search, htmlId) {
    loonWatchCountsChartCreate(search, 'chartSvg')
      .then(res => {})
      .catch(err => {})
}

const recQry = new URLSearchParams(window.location.search);
let lakeId = recQry.get('LAKEID') ? recQry.get('LAKEID') : recQry.get('exportname');
let townName = recQry.get('townName');
let cntyName = recQry.get('countyName');
let search = '';
if (cntyName) {search = `countyName=${cntyName}`;}
if (townName) {search = `townName=${capitalize(townName)}`;}
if (lakeId) {search = `exportname=${lakeId}`;}

loonWatchCountsChartCreate(search, 'chartDiv');

let tblEle = document.getElementById('chartTbl');
let lblEle = document.getElementById('tableLbl');
if (townName) {
  let objHtml = await loonTownTableHtml(townName);
  if (tblEle) {
    tblEle.innerHTML = objHtml.table;
  }
  if (lblEle) {
    lblEle.innerHTML = objHtml.title;
  }
}

/*
Lake/Pond Dashboard definitions:
  - LoonWatch Counts
  - Nesting and Territorial Stats
    - Time-series
    - Most recent
  - Volunteer Stats 
    - # visits this year
    - sightings, most recent sighting
*/

/*
Town Dashboard definitions:
- LoonWatch Counts
- Nesting and Territorial Stats
- List of WaterBodies
  - Surveyed/most recent year
  - Occupied/most recent year
  - Nesting/most recent year
*/