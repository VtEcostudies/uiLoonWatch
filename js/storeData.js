var Storage = window.sessionStorage ? window.sessionStorage : false;

export function setStoreData(storeName, storeData) {
    if (Storage) {
        Storage.setItem(storeName, JSON.stringify(storeData));
    } else {
        console.log(`storedData=>setStoredData | Storage NOT available.`);
    }
}

export function getStoreData(storeName) {
    let storeData = false;
    if (Storage) {
        storeData = Storage ? Storage.getItem(storeName) : false;
        console.log('storeData=>getStoredData | storeData:', storeData);
        if (storeData && '{}' != storeData && '[]' != storeData) {
            storeData = JSON.parse(storeData);
            console.log(`storedData=>getSetStoredData=>Storage.getItem(${storeName}) returned`, storeData);
        } else {
            console.log('storeData=>getStoreData No data found for', storeName);
            storeData = false;
        }
    } else {
        console.log(`storedData=>setStoredData | Storage NOT available.`);
    }
    return storeData;
}
