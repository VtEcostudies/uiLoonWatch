import { config } from './config.js';
const apiHost = config.apiHost;
const apiProt = config.apiProt;

export async function fetchWaterBody(searchTerm) {return await fetchInfo('waterBody',searchTerm);}
export async function fetchBodyLake(searchTerm) {return await fetchInfo('bodyLake',searchTerm);}
export async function fetchBodyLakeGeo(searchTerm) {return await fetchInfo('bodyLakeGeo',searchTerm);}
export async function fetchTown(searchTerm) {return await fetchInfo('town',searchTerm);}
export async function fetchCounty(searchTerm) {return await fetchInfo('county',searchTerm);}
async function fetchInfo(route, searchTerm='') {
    console.log('loonWatchData=>fetchInfo', route, searchTerm);
    const url = `${apiProt}//${apiHost}/info/${route}?${searchTerm}`;
    let enc = encodeURI(url);
    try {
        let res = await fetch(enc);
        //console.log(`loonWatchData::fetchInfo(${searchTerm}) RAW RESULT:`, res);
        let json = await res.json();
        json.query = enc;
        console.log(`loonWatchData::fetchInfo(${route}, ${searchTerm}) JSON RESULT:`, json);
        return json;
    } catch (err) {
        err.query = enc;
        console.log(`loonWatchData::fetchInfo(${route}, ${searchTerm}) ERROR:`, err);
        return new Error(err)
    }
}
export async function fetchSurveyed(searchTerm) {return await fetchStatus('surveyed',searchTerm);}
export async function fetchOccupied(searchTerm) {return await fetchStatus('occupied',searchTerm);}
export async function fetchCombined(searchTerm) {return await fetchStatus('stats',searchTerm);}
export async function fetchCount(searchTerm) {return await fetchStatus('count',searchTerm);}
/*
    Fetch loonWatch lake status
    Fetch loonWatch survey counts
    filter by Lake/Town/County/Region
*/
async function fetchStatus(route='stats', searchTerm='') {
    const url =  `${apiProt}//${apiHost}/loonwatch/${route}?${searchTerm}`;
    let enc = encodeURI(url);
    try {
        let res = await fetch(enc);
        let json = await res.json();
        json.query = enc;
        console.log(`loonWatchData::fetchStatus(${route}, ${searchTerm}) JSON RESULT:`, json);
        return json;
    } catch (err) {
        err.query = enc;
        console.log(`loonWatchData::fetchStatus(${route}, ${searchTerm}) ERROR:`, err);
        return new Error(err)
    }
}

export async function fetchLoonWatch(searchTerm, route='') {
    const url = `${apiProt}//${apiHost}/loonwatch/${route}?${searchTerm}`;
    let enc = encodeURI(url);
    try {
        let res = await fetch(enc);
        let json = await res.json();
        console.log(`loonWatchData::fetchLoonWatch(${route}, ${searchTerm}) JSON RESULT:`, json);
        json.query = enc;
        return json;
    } catch (err) {
        err.query = enc;
        console.log(`loonWatchData::fetchLoonWatch(${route}, ${searchTerm}) ERROR:`, err);
        return new Error(err)
    }
}
