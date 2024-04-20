import { config } from './config.js';
const apiHost = config.apiHost;
const apiProt = config.apiProt;

export async function fetchCounties(searchTerm=false) {return await fetchInfo('counties', searchTerm);}

export async function fetchTowns(searchTerm=false) {return await fetchInfo('towns', searchTerm);}

export async function fetchLakes(searchTerm=false) {return await fetchInfo('lake', searchTerm);}

export async function fetchwaT(searchTerm=false) {return await fetchInfo('lake', searchTerm);}

export async function fetchInfo(item='lake', searchTerm=false) {
    const url = `${apiProt}//${apiHost}/info/${item}`;
    if (searchTerm) {url += `?${searchTerm}`;}
    let enc = encodeURI(url);
    try {
        let res = await fetch(enc);
        let json = await res.json();
        console.log(`vtInfo=>fetchInfo(${item} - ${searchTerm}) JSON RESULT:`, json);
        json.query = enc;
        return json;
    } catch (err) {
        err.query = enc;
        console.log(`vtInfo=>fetchInfo(${item} - ${searchTerm}) ERROR:`, err);
        return new Error(err)
    }
}
