import { fetchLoonWatch, fetchWaterBody, fetchBodyLake, fetchBodyLakeGeo, fetchOccupied, fetchSurveyed } from './loonWatchData.js';
import { fetchTowns, fetchCounties, fetchLakes } from './vtInfo.js';

export async function getDataDownloadData(item = {id:'LL',name:'Loon Location'}, type=0, searchTerm='') {
if (!item || !item.id) {console.log('getDataDownloadData missing item object. Must be like eg. {id:LL, name:Loon Location}')}
let json = {};
switch(item.id) {
    case 'WB': json = await fetchWaterBody(searchTerm); break;
    case 'LL': json = await fetchLakes(searchTerm); break;
    case 'BL': json = await fetchBodyLake(searchTerm); break;
    case 'SL': json = await fetchSurveyed(searchTerm); break;
    case 'OL': json = await fetchOccupied(searchTerm); break;
    case 'VT': json = await fetchTowns(searchTerm); break;
    case 'VC': json = await fetchCounties(searchTerm); break;
}
let name = `loonWatch_${item.name.replace(' ', '_')}`;
if (searchTerm) {name += `_${searchTerm}`;}
if (type) { //json-download
    var res = json.rows;
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res));
    downloadData(dataStr, name + ".json") ;
  } else { //csv-download
    var res = jsonToCsv(json.rows);
    var dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(res);
    downloadData(dataStr, name + ".csv") ;
  }
}

//do the download
function downloadData(dataStr, expName) {
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", expName);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

//convert json array of objects to csv
function jsonToCsv(json) {
  const replacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
  const header = Object.keys(json[0]);  // the first row defines the header
  const csv = [
    header.join(','), // header row first
    ...json.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(',')) //iterate over header keys, extract row data by key
  ].join('\r\n');

  return csv;
}