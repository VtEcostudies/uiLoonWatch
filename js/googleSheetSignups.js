//import { fetchGoogleSheetData } from '../VAL_Web_Utilities/js/fetchGoogleSheetsData.js';

export let sheetIds = {
    loonMonitorSignUps: '1ZSczQ00dj2ku0eY0xcjUBQM-CD2Iu3CiE-wwtbUzk7I',
    loonWatchSignUps: '1Yzx-VhtXAfzPLh6OR3KGzMoShy94x2TU7SPDBLo7FdI'
}

//https://docs.google.com/spreadsheets/d/1Yzx-VhtXAfzPLh6OR3KGzMoShy94x2TU7SPDBLo7FdI/edit?usp=sharing
/* 
    Retrieve LoonWatch Signups from Google Sheet
*/
export async function getLoonWatchSignups(sheetNumber=0) {
    try {
        let res = await fetchGoogleSheetData(sheetIds.loonWatchSignUps, sheetNumber);
        //console.log('getLoonWatchSignups RESULT:', res);
        if (res.status > 299) {return Promise.reject(res);}
        let lake = {};
        let user = {};
        res.rows.forEach(row => {
            if (row.values[1]) { //if sheet's row values are deleted but row is not deleted, API returns row of empty values!!!
                if (row.values[1].formattedValue && row.values[3].formattedValue) { //check if there's an email address and a lake
                    //let lakeId = row.values[3].formattedValue.split(':')[0]; //lakeNames are arbitrarily delimited by colon
                    let fullName = row.values[3].formattedValue;
                    let email = row.values[1].formattedValue;
                    if (!lake[fullName]) {lake[fullName] = [];} //initialize the array of events for a lakeId
                    lake[fullName].push({
                        'date':row.values[0].formattedValue,
                        'email':email, 
                        'mode':row.values[2].formattedValue,
                        'lake':fullName, //lakeId, //lakeId is in position 3 and looks like 'ELLIGO:nc:Greensboro'
                        'new':row.values[4].formattedValue,
                        'first':row.values[5] ? row.values[5].formattedValue : null,
                        'last':row.values[6] ? row.values[6].formattedValue : null,
                        'address':row.values[7] ? row.values[7].formattedValue : null,
                        'town':row.values[8] ? row.values[8].formattedValue : null,
                        'state':row.values[9] ? row.values[9].formattedValue : null,
                        'zip':row.values[10] ? row.values[10].formattedValue : null,
                        'phone':row.values[11] ? row.values[11].formattedValue : null
                        });
                    if (!user[email]) {user[email] = [];} //initialize the array of events for an email
                    user[email].push({
                        'date':row.values[0].formattedValue,
                        'email':email,
                        'mode':row.values[2].formattedValue,
                        'lake':fullName //lakeId //lakeId is in position 3 and looks like 'ELLIGO:nc:Greensboro'
                    });
                }
            }
    })
    //console.log('getLoonWatchSignups Objects', lake, user);
    return {'lake':lake,'user':user};
    } catch(err) {
        console.log(`getLoonWatchSignups(${sheetNumber}) ERROR:`, err);
        return Promise.reject(err);
    }
}
/*
    Fetch a single Google sheet's data by sheet ID and ordinal sheet number.
*/
export async function fetchGoogleSheetData(spreadsheetId=sheetIds.loonWatchSignUps, sheetNumber=0) {
    let apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/?key=${googleApiKey}&includeGridData=true`;

    try {
        let res = await fetch(apiUrl);
        //console.log(`fetchGoogleSheetData(${spreadsheetId},${sheetNumber}) RAW RESULT:`, res);
        if (res.status > 299) {return res;}
        let json = await res.json();
        //console.log(`fetchGoogleSheetData(${spreadsheetId}) JSON RESULT:`, json);
        let prop = json.sheets[sheetNumber].properties;
        let head = json.sheets[sheetNumber].data[0].rowData[0].values;
        let data = json.sheets[sheetNumber].data[0].rowData.slice(1);
        //console.log(`Sheet-${sheetNumber} properties:`, prop);
        //console.log(`Sheet-${sheetNumber} row header:`, head);
        //console.log(`Sheet-${sheetNumber} row data:`, data);
        return {'properties':prop, 'head':head, 'rows':data};
    } catch (err) {
        console.log(`fetchGoogleSheetData(${spreadsheetId}) ERROR:`, err);
        //return new Error(err)
        return Promise.reject(err);
    }
}
