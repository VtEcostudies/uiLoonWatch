
import { loonWatchCountsChartCreate } from './loonWatchData.js';

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
if (townName) {search = `townName=${townName}`;}
if (lakeId) {search = `exportname=${lakeId}`;}

loonWatchCountsChartCreate(search, 'chartDiv');