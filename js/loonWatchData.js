//const config = require('config.js');
var apiHost = `api.loons.vtecostudies.org`;
//apiHost = `localhost:4000`;
export async function fetchLoonWatch(searchTerm) {
    const url = `http://${apiHost}/loonwatch?${searchTerm}`;
    let enc = encodeURI(url);
    try {
        let res = await fetch(enc);
        //console.log(`loonWatchData::fetchLoonWatch(${searchTerm}) RAW RESULT:`, res);
        let json = await res.json();
        console.log(`loonWatchData::fetchLoonWatch(${searchTerm}) JSON RESULT:`, json);
        json.query = enc;
        return json;
    } catch (err) {
        err.query = enc;
        console.log(`loonWatchData::fetchLoonWatch(${searchTerm}) ERROR:`, err);
        return new Error(err)
    }
}
export async function fetchWaterBody(searchTerm) {return await fetchInfo(0,searchTerm);}
export async function fetchTown(searchTerm) {return await fetchInfo(1,searchTerm);}
export async function fetchCounty(searchTerm) {return await fetchInfo(2,searchTerm);}
async function fetchInfo(item=0, searchTerm) {
    const items=['waterBody','town','county'];
    const url = `http://${apiHost}/info/${items[item]}?${searchTerm}`;
    let enc = encodeURI(url);
    try {
        let res = await fetch(enc);
        //console.log(`loonWatchData::fetchInfo(${searchTerm}) RAW RESULT:`, res);
        let json = await res.json();
        console.log(`loonWatchData::fetchInfo(${searchTerm}) JSON RESULT:`, json);
        json.query = enc;
        return json;
    } catch (err) {
        err.query = enc;
        console.log(`loonWatchData::fetchInfo(${searchTerm}) ERROR:`, err);
        return new Error(err)
    }
}
export async function fetchSurveyed(searchTerm) {return await fetchStatus(0,searchTerm);}
export async function fetchOccupied(searchTerm) {return await fetchStatus(1,searchTerm);}
/*
    Fetch lake status by Lake/Town/County/Region
    Status types are 0:surveyed, 1:occupied
*/
async function fetchStatus(type=0, searchTerm) {
    const types = ['surveyed','occupied'];
    const url =  `http://${apiHost}/loonwatch/${types[type]}?${searchTerm}`;
    let enc = encodeURI(url);
    try {
        let res = await fetch(enc);
        //console.log(`loonWatchData::fetchStatus(${searchTerm}) RAW RESULT:`, res);
        let json = await res.json();
        console.log(`loonWatchData::fetchStatus(${searchTerm}) JSON RESULT:`, json);
        json.query = enc;
        return json;
    } catch (err) {
        err.query = enc;
        console.log(`loonWatchData::fetchStatus(${searchTerm}) ERROR:`, err);
        return new Error(err)
    }
}

export async function loonWatchChart(searchTerm, htmlId) {
    // set dimensions and margins of the graph
    var margin = {top: 15, right: 30, bottom: 30, left: 40};
    var width = 400 - margin.left - margin.right; var minWidth = width; 
    var height = 300 - margin.top - margin.bottom;

    fetchLoonWatch(searchTerm)
    .then(data => {
        console.log(`loonWatchData data`, data);
        width = data.counts.length * 10 - margin.left - margin.right;
        width = width >= minWidth ? width : minWidth;

        // append the svg object to the body of the page
        const svg = d3.select(`#${htmlId}`)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

        // X axis
        var x = d3.scaleBand()
            //.range([ 0, width ])
            .range([ width, 0 ])
            .domain(data.counts.map(function(d) { return d.name; }))
            .padding(0.2);
            svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
                //.attr("transform", "translate(-10, 0)rotate(-45)")
                .attr("transform", "translate(-12, 5)rotate(-90)")
                .style("text-anchor", "end");

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0, data.max*(1.1)])
            .range([ height, 0]);
            svg.append("g")
            .call(d3.axisLeft(y));

        // Bars
        svg.selectAll("mybar")
            .data(data.counts)
            .enter()
            .append("rect")
                .attr("x", function(d) { return x(d.name); })
                .attr("y", function(d) { return y(d.count); })
                .attr("width", x.bandwidth())
                .attr("height", function(d) { return height - y(d.count); })
                .attr("fill", "#69b3a2")

        svg.append("text")
            //.attr("x", width / 2 )
            .attr("x", 150 )
            .attr("y", 0)
            .style("text-anchor", "middle")
            //.text(`${taxonName} Observations by Year`)
            .text(`GBIF Observations by Year`)
    })
    .catch(err => {
        console.log(`ERROR loonWatchData ERROR: `, err);
    })
}