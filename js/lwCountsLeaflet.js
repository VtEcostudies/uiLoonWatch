/*
  Load a json array from apiLoonWatch and populate the map with point occurrence data.
*/
import { fetchLoonWatch, fetchWaterBody, fetchOccupied, fetchSurveyed, fetchCombined, loonWatchCountsChart, loonWatchCountsChartCreate} from './loonWatchData.js';
import { fetchTowns, fetchLakes } from './vtInfo.js';
import { getDataDownloadData } from './download.js';
import { getLoonWatchSignups } from './googleSheetSignups.js';
import { mapLayerStyle } from './mapLayerStyles.js';

const loonWatchSignupForm = 'https://docs.google.com/forms/d/e/1FAIpQLSfYH3AP9bLZRJaAP9BKYXDdLvV3TeLkE1HYNWyJYT9Z-ZXJww/viewform';

var uiHost = location.protocol + "//" + location.host;
const fmt = new Intl.NumberFormat(); //use this to format nubmers like fmt.format(value)
var vceCenter = [43.6962, -72.3197]; //VCE coordinates
var vtCenter = [43.916944, -72.668056]; //VT geo center, downtown Randolph
var vtAltCtr = [43.858297, -72.446594]; //VT border center for the speciespage view, where px bounds are small and map is zoomed to fit
var zoomLevel = 8;
var zoomCenter = vtCenter;
var cmRadius = zoomLevel/2;
var loonMap = {};
var basemapLayerControl = false;
var boundaryLayerControl = false;
var stateLayer = false;
var countyLayer = false;
var townLayer = false;
var bioPhysicalLayer = false;
var geoGroup = false; //geoJson boundary group for ZIndex management
var baseMapDefault = null;
var clusterMarkers = false;
var iconMarkers = false;
var abortData = false; //make this global so we can abort a data request
var mapId = 'loonWatchMap'; //this ID must be 
var defaultBoundaries = {State:0,Counties:0,Towns:0,Lakes:1};
var layPop = false; //global reference to layer-based popup. used to close before opening another?
var sheetSignUps = [];

//for standalone use
function addMap() {
    loonMap = L.map(mapId, {
            zoomControl: false, //start with zoom hidden.  this allows us to add it below, in the location where we want it.
            center: vtAltCtr,
            zoom: 8
        });

    new L.Control.Zoom({ position: 'bottomleft' }).addTo(loonMap);

    var attribLarge =  'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

    var attribSmall =  '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            '© <a href="https://www.mapbox.com/">Mapbox</a>';

    var mapBoxAccessToken = 'pk.eyJ1Ijoiamxvb21pc3ZjZSIsImEiOiJjanB0dzVoZ3YwNjlrNDNwYm9qN3NmNmFpIn0.tyJsp2P7yR2zZV4KIkC16Q';

    var streets = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${mapBoxAccessToken}`, {
        maxZoom: 20,
        attribution: attribSmall,
        id: 'mapbox.streets'
    });

    var satellite = L.tileLayer(`https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${mapBoxAccessToken}`, {
        maxZoom: 20,
        attribution: attribSmall,
        id: 'mapbox.satellite'
    });

    var esriWorld = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        id: 'esri.world ',
        maxZoom: 20,
        attribution: 'Tiles &copy; Esri' // &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
      });

    var esriTopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        id: 'esri.topo',
        maxZoom: 20,
        attribution: 'Tiles &copy; Esri' // &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
      });

    var openTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        id: 'open.topo',
        maxZoom: 17,
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
      });

    var googleSat = L.tileLayer("https://{s}.google.com/vt/lyrs=s,h&hl=tr&x={x}&y={y}&z={z}", {
        id: 'google.satellite', //illegal property
        name: 'Google Satellite +', //illegal property
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        zIndex: 0,
        maxNativeZoom: 20,
        maxZoom: 20
      });

    baseMapDefault = esriTopo; //for use elsewhere, if necessary
    loonMap.addLayer(baseMapDefault); //and start with that one

    if(basemapLayerControl === false) {
      basemapLayerControl = L.control.layers().addTo(loonMap);
      //basemapLayerControl = L.control.layers();
    }

    basemapLayerControl.addBaseLayer(streets, "Mapbox Streets");
    basemapLayerControl.addBaseLayer(satellite, "Mapbox Satellite");
    basemapLayerControl.addBaseLayer(esriWorld, "ESRI Imagery");
    basemapLayerControl.addBaseLayer(esriTopo, "ESRI Topo Map");
    basemapLayerControl.addBaseLayer(googleSat, "Google Satellite+");

    console.log('done adding basemaps');

    basemapLayerControl.setPosition("bottomright");

    loonMap.on("zoomend", e => onZoomEnd(e));
    loonMap.on("overlayadd", e => MapOverlayAdd(e));
    loonMap.on("overlayremove", e => MapOverlayRem(e));
    loonMap.on('contextmenu', e => MapContext(e));
}

/* Right-click on map produces lat/lon popup */
function MapContext(e) {
  console.log(e);
  let html = `
  <p>Lat: ${e.latlng.lat}</p>
  <p>Lon: ${e.latlng.lng}</p>`;
  loonMap.openPopup(html, e.latlng, {
    offset: L.point(0, 0)
  });
}
/*
  Fired when an overlay is selected through a layer control. Bring clicked
  layer to the front, then bring Lakes to the front.
*/
function MapOverlayAdd(e) {
  defaultBoundaries[e.layer.options.name] = 1;
  console.log('MapOverlayAdd | Bring', e.layer.options.name, 'to the front.', defaultBoundaries);
  if (typeof e.layer.bringToFront === 'function') {e.layer.bringToFront();} //pull the just-added layer to front
  if (geoGroup) {
    geoGroup.eachLayer(layer => {
      if ('Lakes' == layer.options.name) {
        console.log('MapOverlayAdd | Bring', layer.options.name, 'to the front.');
        layer.bringToFront();
      }
   })
  }
}
function MapOverlayRem(e) {
  defaultBoundaries[e.layer.options.name] = 0;
  console.log('MapOverlayRem', e.layer.options.name, defaultBoundaries);
}

function onZoomEnd(e) {
  zoomLevel = loonMap.getZoom();
  zoomCenter = loonMap.getCenter();
  //SetEachPointRadius();
}

async function zoomVT() {
  if (geoGroup) {
    geoGroup.eachLayer(async layer => {
      if ('State'==layer.options.name) {
        console.log('zoomVT found GeoJson layer', layer.options.name);
        loonMap.fitBounds(layer.getBounds());
      }
    })
  } else {
    loonMap.setView(L.latLng(vtCenter), 8);
  }
}

function zoomLayer(layer) {
  loonMap.fitBounds(layer.getBounds());
}

// Add boundaries to map and control.
async function addBoundaries(setDef=false) {
  if (!setDef) {setDef = defaultBoundaries;}
  
  if (boundaryLayerControl === false) {
      boundaryLayerControl = L.control.layers().addTo(loonMap);
  } else {
      console.log('boundaryLayerControl already added.')
      //return;
  }
  //boundaryLayerControl.setPosition("bottomright");

  console.log("addBoundaries (geoJson) ...");

  try {
      geoGroup = new L.FeatureGroup();
      addGeoJsonLayer('geojson/Polygon_VT_State_Boundary.geojson', "State", 0, boundaryLayerControl, geoGroup, setDef.State);
      addGeoJsonLayer('geojson/Polygon_VT_County_Boundaries.geojson', "Counties", 1, boundaryLayerControl, geoGroup, setDef.Counties);
      addGeoJsonLayer('geojson/Polygon_VT_Town_Boundaries.geojson', "Towns", 2, boundaryLayerControl, geoGroup, setDef.Towns);
      let res = addGeoJsonLayer('geojson/Polygon_VT_Lakes_Inventory.geojson', "Lakes", 3, boundaryLayerControl, geoGroup, setDef.Lakes, true);
      //addGeoJsonLayer('geojson/Polygon_VT_Biophysical_Regions.geojson', "Biophysical Regions", 4, boundaryLayerControl, geoGroup);
      //addGeoJsonLayer('geojson/surveyblocksWGS84.geojson', "Survey Blocks", 5, boundaryLayerControl, geoGroup);
      await res;
      console.log('addBoundaries res:', res);
      return;
  } catch(err) {
    geoGroup = false;
    console.log('addBoundaries ERROR', err)
    return;
  }
}

function addGeoJsonLayer(file="test.geojson", layerName="Test", layerId = 0, layerControl=null, layerGroup=null, addToMap=false, toFront=false) {
  var layer = null;
  return new Promise((resolve, reject) => {
    loadJSON(file, (data) => {
      layer = L.geoJSON(data, {
          onEachFeature: onEachFeature,
          style: onStyle,
          name: layerName, //IMPORTANT: this used to compare layers at ZIndex time
          id: layerId
      });
      if (addToMap) {layer.addTo(loonMap);}
      if (toFront) {layer.bringToFront();} else {layer.bringToBack();}
      if (layerControl) {layerControl.addOverlay(layer, layerName);}
      if (layerGroup) {layerGroup.addLayer(layer);}
      resolve(layer);
    });
  });
}

function loadJSON(file, callback) {
  loadFile(file, "application/json", (res) => {
    callback(JSON.parse(res));
  })
}

/*
  Common MIME Types:
    application/json
    application/xml
    text/plain
    text/javascript
    text/csv
*/
function loadFile(file, mime="text/plain", callback) {
    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType(mime);
    xobj.open('GET', file, true);
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          } else {
            //console.log(`loadFile | status: ${xobj.status} | readyState: ${xobj.readyState}`);
          }
    };
    xobj.send(null);
}

function getIntersectingFeatures(e) {
  var clickBounds = L.latLngBounds(e.latlng, e.latlng);
  var lcnt = 0;
  var fcnt = 0;
  var feat = {};

  var intersectingFeatures = [];
  for (var l in loonMap._layers) {
    lcnt++;
    var overlay = loonMap._layers[l];
    if (overlay._layers) {
      for (var f in overlay._layers) {
        fcnt++;
        var feature = overlay._layers[f];
        var bounds;
        if (feature.getBounds) {
          bounds = feature.getBounds();
        } else if (feature._latlng) {
          bounds = L.latLngBounds(feature._latlng, feature._latlng);
        } else {;}
        if (bounds && clickBounds.intersects(bounds)) {
          var id = `${feature._leaflet_id}`;
          //console.log(`feature._leaflet_id:`,feature._leaflet_id, feat, feat[id]);
          if (feat[id]) {
              //console.log('skipping', feat);
            } else {
              //console.log(`adding`, feat);
              intersectingFeatures.push(feature);
              feat[id] = true;
            }
        }
      }
    }
  }
  console.log(`getIntersectingFeatures | layers: ${lcnt} | features: ${fcnt} | _leaflet_ids:`, feat);
  console.log('intersectingFeatures:', intersectingFeatures);
  var html = null;
  if (intersectingFeatures.length) {
    // if at least one feature found, show it
    html = `<u>Found ${intersectingFeatures.length} features</u><br/>`;
    intersectingFeatures.forEach((ele,idx,arr) => {
      if (ele.defaultOptions && ele.defaultOptions.name) {
        html += ele.defaultOptions.name + ': ';
      }
      if (ele.feature && ele.feature.properties && ele.feature.properties.BLOCKNAME) {html += ele.feature.properties.BLOCKNAME}
      if (ele.feature && ele.feature.properties && ele.feature.properties.TOWNNAME) {html += ele.feature.properties.TOWNNAME}
      if (ele.feature && ele.feature.properties && ele.feature.properties.CNTYNAME) {html += ele.feature.properties.CNTYNAME}
      if (ele.feature && ele.feature.properties && ele.feature.properties.name) {html += ele.feature.properties.name}
      html += '<br/>';
    })
  }
  return html;
}

/*
  Fix eg. townName - remove semicolons, capitalize the first letter of each word
*/
function capitalize(name) {
  name = name.replace(';','');
  let ta = name.split(' ');
  let tf = '';
  for (const tp of ta) {tf += tp[0].toUpperCase() + tp.substring(1).toLowerCase() + ' ';}
  name = tf.trim();
  return name;
}
/*
  Lakes Surveyed (, Lakes Occupied)
*/
async function loonLakePopup(lakeName, layer) {
  lakeName = lakeName.replace(';','').toUpperCase();
  let search = `exportname=${lakeName}`; //VT water bodies sometimes don't match loon exportName, but we can't add % because eg. BROWN% gets 4 lakes
  let lwJson = await fetchLoonWatch(search);
  console.log(`loonLakePopup(${layer.options.name}:${lakeName}) | fetchLoonWatch:`, lwJson);
  let popHt = `<b><u>${lakeName}</u></b>`;
  if (lwJson.rowCount) {
    popHt += `: ${lwJson.rows[0].locationarea} acres<br>`
    for (const row of lwJson.rows) {
      let popCt = Number(row.lwingestadult)+Number(row.lwingestsubadult)+Number(row.lwingestchick);
      popHt += `${moment(row.lwingestdate).format('YYYY')}: `;
      popHt += row.lwingestadult ? `${row.lwingestadult}Ad ` : ''; 
      popHt += row.lwingestsubadult ? `${row.lwingestsubadult}SA ` :'';
      popHt += row.lwingestchick ? `${row.lwingestchick}Ch ` : '';
      popHt += 0==+popCt ? 'Absent' : '';
      popHt += '<br>';
    }
  } else {
    let wbJson = await fetchWaterBody(`wbtextid=${lakeName}`);
    if (1 == wbJson.rowCount) {
      popHt += `: ${wbJson.rows[0].wbarea} acres<br>`;
    }
    popHt += 'No LoonWatch Surveys found.'
  }
  popHt += '<br>' + getSignupLink(lakeName);
  layer.bindPopup(popHt, {minWidth:150}).openPopup();
}
function getSignupLink(wbtextid, action='Volunteer') {
  //?usp=pp_url&entry.712550358=Adopt&entry.559384074=Lake+Abenaki+Thetford&entry.1991296366=No
  //?usp=pp_url&entry.712550358=Adopt&entry.559384074=Abbey+Pond+Ripton&entry.1991296366=No
  let qryArgAdopt = 'entry.712550358'; //entry.712550358=Adopt
  let qryArgFullName = 'entry.559384074'; //entry.559384074=Lake+Abenaki+Thetford
  let qryArgNewUser = 'entry.1991296366'; //entry.1991296366=No
  let fullName = waterBodies[wbtextid] ? waterBodies[wbtextid].wbfullname : '';
  let signArgs = `?usp=pp_url&${qryArgAdopt}=Adopt&${qryArgFullName}=${fullName}`; //&${qryArgNewUser}=No`;
  let signLink = `<a target="_blank" href="${loonWatchSignupForm}${signArgs}"><b>${action}</b> for ${fullName}</a>`;
  if (waterBodies[wbtextid]) {
    console.log('getSignupLink for wbtextid=', wbtextid, signLink);
  } else {
    console.log('getSignupLink', wbtextid, 'NOT found in waterBodies.', waterBodies);
  }
  return signLink;
}

/*
  Water Body, Area, Last Surveyed, Last Occupied
  NOTE: attempt to alter this to inject the zoomTo function into Leaflet popups as suggested here:
  https://stackoverflow.com/questions/13698975/click-link-inside-leaflet-popup-and-do-javascript#13699060
*/
async function loonTownPopup(townName, layer) {
  let bd = defaultBoundaries;
  townName = capitalize(townName)
  let search = `townName=${townName}`;
  let lwJson = await fetchCombined(search);
  console.log(`loonTownPopup(${layer.options.name}:${townName}) | fetchCombined:`, lwJson);
  let popHtm = '';
  let hasData = false;
  if (lwJson.rowCount && lwJson.rows[0].wbtextid) {
    popHtm = '';
    popHtm += ` Water Bodies</u>:<br><table class="poptbl"><tr><th>Name</th><th>Area</th><th>Surveyed</th><th>Occupied</th></tr>`;
    for (const row of lwJson.rows) {
      let lakeArea = row.wbarea ? row.wbarea : '';
      if (row.lakeName) {
        let lastSurveyed = row.lastSurveyed ? row.lastSurveyed : '';
        let lastOccupied = row.lastOccupied ? row.lastOccupied : '';
        hasData = hasData ? hasData : row.lastSurveyed;
        popHtm += `<tr><td><a href="${uiHost}/chart.html?LAKEID=${row.wbtextid}">${row.lakeName}</a></td><td>${lakeArea}</td><td>${lastSurveyed}</td><td>${lastOccupied}</td></tr>`
      } else {
        popHtm += `<tr><td><a href="${uiHost}?LAKEID=${row.wbtextid}&${strQueryParams}">${row.wbtextid}</a></td><td>${lakeArea}</td><td></td><td></td></tr>`;
        //let parm = {'LAKEID':row.wbtextid};let urlParm = new URLSearchParams(parm);
        //popHtm += `<tr><td><button onclick="${console.log('test')}">${row.wbtextid}</button></td><td>${lakeArea}</td><td></td><td></td></tr>`;
      }
    }
    let title = ''
    if (hasData) {title = `<u>Town of <b><a href="${uiHost}/chart.html?townName=${townName}">${townName}</a></b>`;}
    else {title = `<u>Town of <b>${townName}</b>`;}
    popHtm = title + popHtm;
  } else {
    popHtm = `<u>Town of <b>${townName}</b></u> has no water bodies.`;
  }
  layer.bindPopup(popHtm, {minWidth:150}).openPopup();
}

/*
  Lakes, Lakes Surveyed (, Lakes Occupied)
*/
async function loonCntyPopup(cntyName, layer) {
  let bd = defaultBoundaries;
  cntyName = capitalize(cntyName);
  let search = `countyName=${cntyName}`;
  let lwJson = await fetchSurveyed(search);
  console.log(`loonCntyPopup(${layer.options.name}:${cntyName}) | fetchSurveyed:`, lwJson);
  let popHt = `County of <u><b>${cntyName}</b>`;
  if (lwJson.rowCount) {
    popHt += ` Lakes Surveyed</u>:<br>`;
    for (const row of lwJson.rows) {
      popHt += `<a href="${uiHost}?LAKEID=${row.wbtextid}&townBoundary=${+bd.Towns}&countyBoundary=${+bd.Counties}">${row.wbtextid}</a> in ${row.surveyed}`;
      popHt += '<br>';
    }
  } else {
    let wbJson = await fetchWaterBody(`countyName=${cntyName}`);
    popHt += ` Water Bodies:</u><br>`;
    if (wbJson.rowCount) {
      for (const row of wbJson.rows) {
        popHt += `<a href="${uiHost}?LAKEID=${row.wbtextid}&townBoundary=${+bd.Towns}&countyBoundary=${+bd.Counties}">${row.wbtextid}</a> (${row.wbofficialname})`;
        popHt += '<br>';
      }
    } else {
      popHt += `None Found.`;
    }
  }
  layer.bindPopup(popHt).openPopup();
}

//type = 'lake', 'town', 'county', '' (empty type means 'state')
function loonChartPopup(type=false, name=false, layer) {
  let search = '';
  if (type && name) {
    if ('lake'==type) {
      name = name.replace(';','').toUpperCase();
      search = `exportname=${name}`;
    } else {
      name = capitalize(name);
      search = `${type}Name=${name}`;
    }
  }
  //IMPORTANT: REMOVE AND CREATE CONTAINER TAG WITH EACH POPUP
  let popTag = `<div id="popTag" style="width:400px; height:250px; cursor:pointer;"><span id="signupLink"></span></div>`;
  let tagEle = document.getElementById("popTag");
  if (tagEle) {tagEle.innerHTML = ''; tagEle.remove();} //MUST remove previous popup elemet to show popup chart 2nd time
  layPop = layer.bindPopup(popTag, {maxWidth:"auto"}).openPopup(); //MUST openPopup before hanging SVG chart on it
  loonWatchCountsChart(search, "popTag") //hang the chart on the div defined above
    .catch(err => {loonTypePopup(type, name, layer);}) //no LoonWatch surveys, show other info
    .then(res => { //now add link to signup for lake
      if ('lake'==type) {addLakeSignupLink(name);}
    })
}
function addLakeSignupLink(name) {
  let sgnEle = document.getElementById("signupLink");
  sgnEle.innerHTML = getSignupLink(name);
}

function loonTypePopup(type, name, layer) {
  switch(type) {
    case 'lake':
      loonLakePopup(name, layer);
      break;
    case 'town':
      loonTownPopup(name, layer);
      break;
    case 'county':
      loonCntyPopup(name, layer);
      break;
  }
}

function filterLakeName(raw) {
  //let fix = raw.replace(/[^a-zA-Z1-9\(\)\- ]/g, "").trim(); //remove special characters from string
  let fix = raw.replace(/\r?\n|\r|\t/g, "").trim(); //remove special characters from string
  //console.log('filterLakeName', raw, fix);
  return fix;
}

function onEachFeature(feature, layer) {
    layer.on('mousemove', function (event) {
      //console.log('mousemove', event);
    });
    layer.on('click', function (event) {
        //console.log('click | event', event, '| layer', layer);
        event.target._map.fitBounds(layer.getBounds());
        //console.log('Layer Click | Layer:', layer);
        console.log('Layer Click | Layer name:', layer.options.name, '| Feature:', feature.properties);
        //getGeoJsonFeatureByGroupNameAndFeatureName(layer.options.name, feature.properties.CNTYNAME || feature.properties.TOWNNAME || feature.properties.LAKEID);
        if ('Lakes' == layer.options.name || feature.properties.LAKEID) {
          let lakeId = filterLakeName(feature.properties.LAKEID);
          console.log('onEachFeature=>layer.onclick=>feature.properties.LAKEID', lakeId);
          loonChartPopup('lake', lakeId, layer);
        }
        if ('Towns' == layer.options.name || feature.properties.TOWNNAME) {
          //loonChartPopup('town', feature.properties.TOWNNAME, layer);
          loonTownPopup(feature.properties.TOWNNAME, layer);
        }
        if ('Counties' == layer.options.name || feature.properties.CNTYNAME) {
          loonChartPopup('county', feature.properties.CNTYNAME, layer);
        }
        if ('State' == layer.options.name) {
          loonChartPopup(false, false, layer);
        }
    });
    layer.on('contextmenu', function (event) {
        //console.log('CONTEXT-MENU | event', event, '| layer', layer);
        //event.target._map.fitBounds(layer.getBounds());
        //var html = getIntersectingFeatures(event);
        /*
        loonMap.openPopup(html, event.latlng, {
          offset: L.point(0, -24)
        });
        */
    });
    if (feature.properties) {
        var obj = feature.properties;
        var tips = '';
        var pops = '';
        for (var key in obj) { //iterate over feature properties
          switch(key.substr(key.length - 4).toLowerCase()) { //last 4 characters of property
            case 'name':
              tips += `${obj[key]}<br>` + tips;
              break;
          }
          switch(key) {
            case 'LAKEID':
            case 'GISAcres':
            case 'WBID':
              tips += `${key}: ${obj[key]}<br>`;
              break;
            default:
              //tips += `${key}: ${obj[key]}<br>`;
              break;
          }
        }
      if (tips) {layer.bindTooltip(tips);}
      if (pops) {layer.bindPopup(pops);}
    }
}

/*
  Callback function to set style of added geoJson overlays on the Boundary Layer Control
*/
function onStyle(feature) {
    if (feature.properties.BLOCK_TYPE) {
      switch(feature.properties.BLOCK_TYPE) {
        case 'PRIORITY':
          return {color:"black", weight:1, fillOpacity:0.2, fillColor:"red"};
          break;
        case 'NONPRIOR':
          return {color:"black", weight:1, fillOpacity:0.0, fillColor:"yellow"};
          break;
      }
    } else {
      if (feature.properties.BIOPHYSRG1) { //biophysical regions
        return {color:"red", weight:1, fillOpacity:0.0, fillColor:"red"};
      } else if (feature.properties.CNTYNAME) { //counties
        return {color:"yellow", weight:1, fillOpacity:0.0, fillColor:"yellow"};
      } else if (feature.properties.TOWNNAME) { //towns
        return {color:"blue", weight:1, fillOpacity:0.0, fillColor:"blue"};
      } else {
        return {color:"black", weight:1, fillOpacity:0.0, fillColor:"black"};
      }
    }
}

function getTestData(file, taxonName) {
  //load test data
  loadJSON(file, (data) => {
    updateMap(data.occurrences, taxonName);
  });
}

function abortDataLoad() {
    console.log('abortDataLoad request received.');
    abortData = true;
}

/*
  Handle a click on an occurrence marker. This is done to avoid hanging a popup on each point to improve performance.
  There is a performance hit, still, because we have to hang popup data on the marker when it's created.
*/
async function markerOnClick(e) {
  //eleWait.style.display = 'block';

  let options = e.target ? e.target.options : e.options;
  let latlng = e.latlng ? e.latlng : e._latlng;

  //console.log('markerOnClick', latlng, options);

  var popup = L.popup({
    maxHeight: 200,
    keepInView: true
    })
    .setContent(await occurrencePopupInfo(options)) //must use await to avoid error
    .setLatLng(latlng)
    .openOn(loonMap);

    //eleWait.style.display = 'none';
}

async function markerMouseOver(e) {
  //console.log('markerMouseOver', e);
  let o = e.target.options;
  let content = `
    <b><u>${o.canonicalName}</u></b><br>
    ${o.recordedBy ? o.recordedBy : 'Unknown'}<br>
    ${moment(o.eventDate).format('YYYY-MM-DD')}<br>
    `;
  e.target.bindTooltip(content).openTooltip();
}

/*
  Respond to a click on a leaflet.cluster group
*/
async function clusterOnClick(e) {
  //console.log('clusterOnClick | target.options:', e.target.options);
  //console.log('clusterOnClick | childMarkerCount:', e.layer.getAllChildMarkers().length);
  //console.log('clusterOnClick | cluster:', e.layer);

  let cluster = e.layer
  let bottomCluster = cluster;
/*
  while (bottomCluster._childClusters.length === 1) {
    bottomCluster = bottomCluster._childClusters[0];
  }

  if (bottomCluster._zoom === this._maxZoom && bottomCluster._childCount === cluster._childCount) {
    // All child markers are contained in a single cluster from this._maxZoom to this cluster.
    //console.log('clusterOnClick | Cluster will Spiderfy');
    if (loonMap.getZoom() < 15) {
      //loonMap.setView(e.latlng, 15); //loonMap.getZoom()+5
    }
  } else {
    //console.log(`clusterOnClick | Cluster will Zoom`);
  }
*/
  if (cluster._group._spiderfied) {
    //console.log('clusterOnClick | Cluster IS Spiderfied. Unspiderfy.');
    cluster.unspiderfy();
  }
}

async function clusterOnSpiderfied(e) {
  //console.log('clusterOnSpiderfied | e:', e);

  let list = `<b><u>${e.markers.length} Occurrences</u></b><br>`;

  e.markers.forEach(async (mark, idx) => {
    //console.log('child marker', idx, mark.options);
    let o = mark.options;
    if (o.noCoordinates) {
      list += `LOCATION ${o.noCoordinates} - <a href="https://gbif.org/occurrence/${o.gbifID}">${o.gbifID}</a>: ${o.canonicalName}, ${moment(o.eventDate).format('YYYY-MM-DD')}, ${o.recordedBy ? o.recordedBy : 'Unknown'}<br>`;
    } else {
      list += `<a href="https://gbif.org/occurrence/${o.gbifID}">${o.gbifID}</a>: ${o.canonicalName}, ${moment(o.eventDate).format('YYYY-MM-DD')}, ${o.recordedBy ? o.recordedBy : 'Unknown'}<br>`;
    }
  })

  var popup = L.popup({
    maxHeight: 200,
    keepInView: false
    })
    .setContent(list)
    .setLatLng(e.cluster._latlng)
    .openOn(loonMap);
}

/*
  Shapes defined by divIcon className can be resized with divIcon iconSize (square, round, ...)
  Shapes defined by custom html/css don't respond to divIcon iconSize (diamond, ...)
*/
function getClusterIconOptions(grpIcon, cluster, color=false, size=30) {
  let html;
  let name;
  let syze = L.point(size, size);

  //console.log('getClusterIconOptions | cluster:', cluster);

  switch(grpIcon) {
    default:
    case 'round':
      html = `<div class="cluster-count ${foreground(color)}"> ${cluster ? cluster.getChildCount() : ''} </div>`;
      name = `${grpIcon}-shape`;
      if (color) name = `${name} bg-${color}`; //add bg-{color} as classname
      break;
    case 'square':
      html = `<div class="cluster-count ${foreground(color)}"> ${cluster ? cluster.getChildCount() : ''} </div>`;
      name = `${grpIcon}-shape`;
      if (color) name = `${name} bg-${color}`; //add bg-{color} as classname
      break;
    case 'triangle':
      //html = `<div class="triangle-count-old ${foreground(color)}"> ${cluster ? cluster.getChildCount() : ''} </div>`;
      //name = cluster ? 'triangle-shape-old' : 'triangle-small-old';
      //if (color) name = `${name} bb-${color}`; //add border-bottom-{color} as classname
      html = `<div class="triangle-count ${foreground(color)}"> ${cluster ? cluster.getChildCount() : ''} </div>`;
      name = 'triangle-shape';
      if (color) name = `${name} bg-${color}`; //add bg-{color} as classname
      break;
    case 'diamond':
      html = `
        <div class="${cluster ? 'diamond-shape' : 'diamond-small'} bg-${color}">
          <div class="diamond-count ${foreground(color)}">${cluster ? cluster.getChildCount() : ''}</div>
        </div>`;
      //no className for diamond, styling is in html, above
      break;
    case 'star':
      html = `
        <div class="${cluster ? 'diamond-shape' : 'diamond-small'} bg-${color}">
          <div class="diamond-count ${foreground(color)}">${cluster ? cluster.getChildCount() : ''}</div>
        </div>`;
      name = 'diamond-shape'; //this creates a non-rotated square
      if (color) name = `${name} bg-${color}`; //add bg-{color} as classname
      break;
    }
  //console.log(`getClusterIconOptions | divIcon html:`, html)
  //return {'html':html, 'className':name, 'iconSize':syze, 'iconAnchor':[size, size]}
  return {'html':html, 'className':name, 'iconSize':syze}
}

function foreground(color) {
  switch(color) {
    case 'red': return 'white';
    case 'blue': return 'yellow';
    case 'yellow': return 'blue';
    case 'black': return 'white';
    default: return 'black';
  }
}

async function getCentroid(type, valu) {
  //console.log('getCentroid', type, valu);
  let item = await getGeoJsonFeatureByGroupNameAndFeatureName(type, valu);
  console.log('getCentroid RESULT', item);
  if (item.feature) {
    try {
      let gTyp = item.feature.geometry.type;
      let polygon;
      if ('Polygon' == gTyp) {
        console.log(`getCentroid | Geometry Type POLYGON`);
        polygon = turf.polygon(item.feature.geometry.coordinates);
      } else if ('GeometryCollection' == type) {
        console.log(`getCentroid | Geometry Type GEOMETRY COLLECTION`);
        polygon = turf.polygon(item.feature.geometry.geometries[0]);
      }
      let centroid = turf.centroid(polygon);
      console.log(`getCentroid | ${type} ${valu} CENTROID:`, centroid);
      //let centMark = L.marker([centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]]).addTo(loonMap);
      return L.latLng(centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]);
    } catch (err) {
      console.log('getCentroid ERROR:', err);
      return L.latLng(42.0, 71.5);
    }
  } else {
    return L.latLng(42.0, 71.5);
  }
}

async function getGeoJsonFeatureByGroupNameAndFeatureName(group, name) {
  if (geoGroup) {
    for await (const [index, layer] of Object.entries(geoGroup._layers)) {
      console.log('geoGroup Layer:', layer);
      console.log('getGeoJsonFeatureByGroupNameAndFeatureName found GeoJson layer', layer, layer.options.name,group.slice(0,5).toUpperCase(),layer.options.name.slice(0,5).toUpperCase());
      if (group.slice(0,5).toUpperCase()==layer.options.name.slice(0,5).toUpperCase()) {
        console.log('getGeoJsonFeatureByGroupNameAndFeatureName SELECTED GeoJson layer', layer.options.name);
        console.log(`getGeoJsonFeatureByGroupNameAndFeatureName | layer:`, layer);
        let feature = await getGeoJsonFeatureFromLayerByName(layer, name)
        return feature;
      }
    }
  }
  console.log('GROUP loop DONE.');
  return {};
}
async function getGeoJsonGroupFromName(group) {
  if (geoGroup) {
    for await (const [index, layer] of Object.entries(geoGroup._layers)) {
      console.log('geoGroup Layer:', layer);
      console.log('getGeoJsonFeatureByGroupNameAndFeatureName found GeoJson layer', layer, layer.options.name,group.slice(0,5).toUpperCase(),layer.options.name.slice(0,5).toUpperCase());
      if (group.toUpperCase()==layer.options.name.toUpperCase()) {
        return layer;
      }
    }
  }
  console.log('GROUP loop DONE.');
  return {};
}
async function getGeoJsonFeatureFromLayerByName(layer, name) {
  for await (const [key, val] of Object.entries(layer._layers)) { //iterate over geoJson layer's feature layers
    //console.log(key, val.feature.properties);
    if (name.toUpperCase() == 'VERMONT') {
      return val;
    }
    if (name.toUpperCase() == val.feature.properties.CNTYNAME) {
      //console.log(`getGeoJsonFeatureFromLayerByName found CNTYNAME`, val.feature.properties.CNTYNAME)
      //console.log(`getGeoJsonFeatureFromLayerByName feature`, val)
      return val;
    }
    if (name.toUpperCase() == val.feature.properties.TOWNNAME) {
      //console.log(`getGeoJsonFeatureFromLayerByName found TOWNNAME`, val.feature.properties.TOWNNAME);
      //console.log(`getGeoJsonFeatureFromLayerByName feature`, val);
      return val;
    }
    if (name.toUpperCase() == val.feature.properties.BLOCKNAME) {
      //console.log(`getGeoJsonFeatureFromLayerByName found BLOCKNAME`, val.feature.properties.BLOCKNAME)
      //console.log(`getGeoJsonFeatureFromLayerByName feature`, val)
      return val;
    }
    let lakeId = filterLakeName(val.feature.properties.LAKEID)
    if (name.toUpperCase() == lakeId) {
      console.log(`getGeoJsonFeatureFromLayerByName found LAKEID`, lakeId)
      console.log(`getGeoJsonFeatureFromLayerByName feature`, val)
      return val;
    }
  }
  console.log('FEATURE loop DONE.'); 
  return {};
}

/*
 * use moment to convert eventDate (which comes to us from VAL API as UTC epoch milliseconds with time *removed*, so
 * it's always time 00:00, and we cannot report time, only date) to a standard date format.
 *
 * return date in the format YYYY-MM-DD
 */
function getDateYYYYMMDD(msecs) {

    var m = moment.utc(msecs);

    return m.format('YYYY-MM-DD');
}

function getDateMMMMDoYYYY(msecs) {

    var m = moment.utc(msecs);

    return m.format('MMMM Do YYYY');
}

//iterate through all plotted pools in each featureGroup and alter each radius
function SetEachPointRadius(radius = cmRadius) {
  cmRadius = Math.floor(zoomLevel/2);
  Object.keys(cmGroup).forEach((taxonName) => {
    cmGroup[taxonName].eachLayer((cmLayer) => {
      cmLayer.setRadius(radius);
      cmLayer.bringToFront(); //this works, but only when this function is called
    });
  });
}

function addMapCallbacks() {

  loonMap.on('zoomend', function () {
        console.log(`Map Zoom: ${loonMap.getZoom()}`);
    });
    loonMap.on('moveend', function() {
        console.log(`Map Center: ${loonMap.getCenter()}`);
    });

}

//standalone module usage
function initMap() {
    addMap();
    addMapCallbacks();
}

export async function zoomTo(rawQry) { //pass a literal JSON object, not an objUrlParam...
  console.log('zoomTo', rawQry);
  let objQry = new URLSearchParams(rawQry);
  let lakeId = objQry.get('LAKEID');
  let townId = objQry.get('town') || objQry.get('townName') || objQry.get('Town') || objQry.get('TownName');
  let cntyId = objQry.get('county') || objQry.get('countyName') || objQry.get('County') || objQry.get('CountyName');
  let typeId; let itemId;
  if (lakeId) {typeId='Lakes'; itemId=lakeId;}
  else if (townId) {typeId='Towns'; itemId=townId;}
  else if (cntyId) {typeId='Counties'; itemId=cntyId;}
  if (itemId) {
    let layer = await getGeoJsonGroupFromName(typeId);
    let feature = false;
    if (layer) {feature = await getGeoJsonFeatureFromLayerByName(layer, itemId);}
    console.log('zoomTo | geoJson layer for', typeId, layer);
    console.log('zoomTo | geoJson feature for:', itemId, feature);
    if (feature.feature) {
      zoomLayer(feature);
    } else {
      console.log(`zoomTo(Layer:${typeId} Feature:${itemId}) failed - ${itemId} not found in ${typeId}.`);
      if ('Lakes' == typeId) {
        let res = await fetchWaterBody(`wbtextid=${itemId}`);
        if (1 == res.rowCount) {
          let wb = res.rows[0]; let lat=wb.wbcenterlatitude; let lng=wb.wbcenterlongitude; let latlon=L.latLng({'lat':lat, 'lng':lng});
          loonMap.setView(latlon, 15);
          let html = `<p>${itemId} (${wb.wbfullname})</p>`;
          loonMap.openPopup(html, latlon, {offset: L.point(0, 0)});
        } else {
          console.log(`zoomTo(Layer:${typeId} Feature:${itemId}) failed - got ${res.rowCount} from ${res.query}`)
        }
      }
    }
  }
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
  wbPromise = fetchWaterBody(search);
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

async function getLoonSignups() {
  //get an object of sheetSignUps with an array of signup events containing: email, lakeId, and date
  sheetSignUps = await getLoonWatchSignups();
  console.log('getLoonSignups', sheetSignUps);
  return sheetSignUps;
}
function putLoonSignups(signUps) {
  geoGroup.eachLayer(layer => {
    //console.log(`putSignups found GeoJson layer:`, layer.options.name);
    if ('Lakes'==layer.options.name) {
      console.log(`putSignups found GeoJson layer:`, layer.options.name);
      layer.eachLayer(subLay => {
        //console.log(subLay.feature.properties);
        let lakeId = filterLakeName(subLay.feature.properties.LAKEID); //geoJson LAKEIDS are not clean
        let fullName = waterBodies[lakeId] ? waterBodies[lakeId].wbfullname : false; //here we match geoJson LAKEID to our db waterBodies - there are disagreements!
        if (!fullName) {console.log('putLoonSigups LAKEID Not Found in waterBodies:', lakeId);}
        if (signUps.lake[fullName]) {
          //console.log('putLoonSignUps found signup for', fullName, lakeId, signUps[fullName], subLay.feature.properties);
          //Problem: there's a list of timeStamped adoption/declinations. We need a distilled list that processed those, here.
          signUps.lake[fullName].forEach(signUp => {
            switch(signUp.mode) {
              case 'Adopt': subLay.setStyle(mapLayerStyle.signupLoonWatchStyle); break;
            }
          })
        } else {
          subLay.setStyle(mapLayerStyle.signupMissingStyle);
        }
      })
    }
  })
}

/*
*/
var strQueryParams = '';
if (document.getElementById("leafletMap")) {
    console.log('Element leafletMap')
    window.addEventListener("load", async function() {
      console.log('window load event');
      const recQry = new URLSearchParams(window.location.search);
      
      
      recQry.forEach((val, key) => {
        console.log('Query Param:', key, val);
        let param =  `${key}=${val}`;
        strQueryParams += strQueryParams ? '&' : '';
        strQueryParams += param;
      });
    
      initMap();
      loonMap.options.minZoom = 7;
      loonMap.options.maxZoom = 17;
      let tb = +recQry.get('townBoundary') || 0;
      let cb = +recQry.get('countyBoundary') || 0;
      let sb = +recQry.get('stateBoundary') || 0;
      let lb = +recQry.get('lakeBoundary') || 1;
      defaultBoundaries = {State:sb,Counties:cb,Towns:tb,Lakes:lb};
      await addBoundaries(defaultBoundaries);
      if (recQry.size > 0) {
        zoomTo(recQry);
      }
      
      if (document.getElementById("zoomVT")) {
        document.getElementById("zoomVT").addEventListener("click", () => {
          console.log('zoomVT button click');
          zoomVT();
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
          let urlParm =  new URLSearchParams(parm);
          zoomTo(parm);
          eleTown.value = 'default';
        });
      }

      let eleLake = document.getElementById("lakeVT");
      if (eleLake) {
        //lakeDropDown();
        waterBodyDropDown();
        eleLake.addEventListener("change", (e) => {
          let lakeId = eleLake.selectedOptions[0].value;
          console.log('lakeVT change', lakeId);
          //this.location.assign(`${uiHost}?LAKEID=${lakeId}`);
          let parm = {'LAKEID':lakeId};
          let urlParm =  new URLSearchParams(parm);
          zoomTo(parm);
          eleLake.value = 'default';
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

      wbPromise.then(json => { //must wait for waterBodies to load before putting signups
        getLoonSignups().then(signUps => {
            putLoonSignups(signUps);
        })
      })

    }); //end window.onload
}
