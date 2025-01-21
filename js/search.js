import { fetchWaterBody} from './loonWatchData.js';
import { capitalize } from './utils.js';
import { fetchCounties, fetchTowns, fetchLakes } from './vtInfo.js';
import { getDataDownloadData } from './download.js';

function reloadIframes(params) {
    parent.mapSource(`/iframe/map.html?${params}`);
    parent.chartSource(`/iframe/chart.html?${params}`);
}

let eleState = document.getElementById("stateVT");
if (eleState) {
    eleState.addEventListener("click", (e) => {
        parent.postMessage({source:'loonwatch-search', params:{'state':'Vermont'}});
        eleLake.value = 'default';
        eleTown.value = 'default';
        eleCnty.value = 'default';
        })
}

let eleCnty = document.getElementById("countyVT");
if (eleCnty) {
  countyDropDown();
  eleCnty.addEventListener("change", (e) => {
    let countyName = eleCnty.selectedOptions[0].value;
    console.log('countyVT change', countyName);
    //this.location.assign(`${uiHost}?townName=${townName}&townBoundary=1`);
    let parm = {'countyName':countyName};
    /*
    zoomTo(parm);
    eleCnty.value = 'default';
    parent.mapSource(`/iframe/map.html?countyName=${countyName}&countyBoundary=1&townBoundary=0`);
    parent.chartSource(`/iframe/chart.html?countyName=${countyName}`);
    */
    eleLake.value = 'default';
    eleTown.value = 'default';
    //parent.postMessage({source:'loonwatch-search', params:`countyName=${countyName}`});
    parent.postMessage({source:'loonwatch-search', params:parm});
});
}

let eleTown = document.getElementById("townVT");
if (eleTown) {
  townDropDown();
  eleTown.addEventListener("change", (e) => {
    let townName = eleTown.selectedOptions[0].value;
    console.log('townVT change', townName);
    //this.location.assign(`${uiHost}?townName=${townName}&townBoundary=1`);
    let parm = {'townName':townName};
    /*
    zoomTo(parm);
    eleTown.value = 'default';
    parent.mapSource(`/iframe/map.html?townName=${townName}&townBoundary=1&countyBoundary=0`);
    parent.chartSource(`/iframe/chart.html?townName=${townName}`);
    */
    eleLake.value = 'default';
    eleCnty.value = 'default';
    //parent.postMessage({source:'loonwatch-search', params:`townName=${townName}`});
    parent.postMessage({source:'loonwatch-search', params:parm});
});
}

let eleLake = document.getElementById("lakeVT");
if (eleLake) {
  //lakeDropDown();
  waterBodyDropDown();
  eleLake.addEventListener("change", (e) => {
    let lakeId = eleLake.selectedOptions[0].value;
    console.log('lakeVT change', lakeId);
    //this.location.assign(`${uiHost}?LAKEID=${lakeId}&lakeBoundary=1`);
    let parm = {'LAKEID':lakeId};
    /*
    zoomTo(parm);
    eleLake.value = 'default';
    parent.mapSource(`/iframe/map.html?LAKEID=${lakeId}&lakeBoundary=1`);
    parent.chartSource(`/iframe/chart.html?LAKEID=${lakeId}`);
    */
    eleTown.value = 'default';
    eleCnty.value = 'default';
    //parent.postMessage({source:'loonwatch-search', params:`LAKEID=${lakeId}`});
    parent.postMessage({source:'loonwatch-search', params:parm});
});
}

let eleItm = document.getElementById("download-item");
if (eleItm) {
  eleItm.addEventListener("change", function(e) {
    console.log(e.target);
    let item = eleItm.selectedOptions[0].value;
    let name = eleItm.selectedOptions[0].innerText;
    getDataDownloadData({id: item, name: name}, 0);
    eleItm.value = 'default';
  });
}

async function countyDropDown(search) {
    let json = await fetchCounties(search); //an array of counties
    let sel = document.getElementById('countyVT');
    json.rows.forEach(elem => {
      if ('Unknown' != elem.countyName) {
        let opt = document.createElement('option');
        opt.innerHTML = elem.countyName;
        opt.value = elem.countyName;
        sel.appendChild(opt)
      }
    });
}

async function townDropDown(search) {
    let json = await fetchTowns(search); //an array of towns
    let sel = document.getElementById('townVT');
    json.rows.forEach(town => {
      if ('Unknown' != town.townName) {
        let opt = document.createElement('option');
        opt.innerHTML = town.townName;
        opt.value = town.townName;
        sel.appendChild(opt)
      }
    });
}
  
async function lakeDropDown(search) {
    let json = await fetchLakes(search); //an array of lakes
    let sel = document.getElementById('lakeVT');
    json.rows.forEach(lake => {
        if ('Unknown' != lake.locationname) {
        let opt = document.createElement('option');
        opt.innerHTML = lake.locationname;
        opt.value = lake.exportname;
        sel.appendChild(opt)
        }
    });
}
  
let waterBodies = {}; var wbPromise = new Promise((resolve, reject) => {});
async function waterBodyDropDown(search) {
    wbPromise = fetchWaterBody(`orderBy=wbfullname&${search}`);
    let sel = document.getElementById('lakeVT');
    wbPromise.then(json => {
        json.rows.forEach(wb => {
        if ('Unknown' != wb.wbtextid) {
            waterBodies[wb.wbtextid] = wb; 
            let opt = document.createElement('option');
            opt.innerHTML = `${wb.wbfullname}`;
            opt.value = wb.wbtextid;
            sel.appendChild(opt)
        }
        });
    }).catch(err => {
        console.log('waterBodyDropDown=>fetchWaterBody ERROR', err);
    })
}
