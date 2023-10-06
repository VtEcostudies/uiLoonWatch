/*
module.exports = {
    env: {'dev-local':1,'dev-remote':1,'production':1},
    apiHost: {
        'dev-local':'localhost:4000',
        'dev-remote': 'api.dev.loons.vtecostudies.org',
        'production':  'api.loons.vtecostudies.org'
    },
    uiHost: {
        'dev-local':'localhost:8000',
        'dev-remote': 'dev.loons.vtecostudies.org',
        'production':  'loons.vtecostudies.org'
    }
}
*/

export let config = {};
config.uiHost = location.protocol;
config.uiHost = location.protocol + '//' + location.host; //this will include :xxxx port
config.uiName = location.host.split(':')[0]; //just the host name, like 'localhost', or 'loons.vtecostudies.org'
switch(config.uiName) {
    case 'localhost': 
        config.apiHost = 'localhost:4000'; 
        config.apiProt = location.protocol;
        break;
    case 'dev.loons.vtecostudies.org': 
        config.apiHost = 'api.dev.loons.vtecostudies.org';
        config.apiProt = location.protocol;
        break;
    case 'loons.vtecostudies.org': 
        config.apiHost = 'api.loons.vtecostudies.org'; 
        config.apiProt = location.protocol;
        break;
}
console.log('config.js', config);