import { config } from './config.js';
const apiHost = config.apiHost;
const apiProt = config.apiProt;

export async function fetchTowns(searchTerm=false) {
    const url = `${config.apiProt}//${apiHost}/info/towns`;
    if (searchTerm) {url += `?${searchTerm}`;}
    let enc = encodeURI(url);
    try {
        let res = await fetch(enc);
        //console.log(`vtInfo::fetchTowns(${searchTerm}) RAW RESULT:`, res);
        let json = await res.json();
        console.log(`vtInfo::fetchTowns(${searchTerm}) JSON RESULT:`, json);
        json.query = enc;
        return json;
    } catch (err) {
        err.query = enc;
        console.log(`vtInfo::fetchTowns(${searchTerm}) ERROR:`, err);
        return new Error(err)
    }
}

export async function fetchLakes(searchTerm=false) {
    const url = `${config.apiProt}//${apiHost}/info/lake`;
    if (searchTerm) {url += `?${searchTerm}`;}
    let enc = encodeURI(url);
    try {
        let res = await fetch(enc);
        //console.log(`vtInfo::fetchLakes(${searchTerm}) RAW RESULT:`, res);
        let json = await res.json();
        console.log(`vtInfo::fetchLakes(${searchTerm}) JSON RESULT:`, json);
        json.query = enc;
        return json;
    } catch (err) {
        err.query = enc;
        console.log(`vtInfo::fetchLakes(${searchTerm}) ERROR:`, err);
        return new Error(err)
    }
}
