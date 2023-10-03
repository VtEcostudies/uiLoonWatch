//const apiHost = require('config.js').apiHost; //`api.loons.vtecostudies.org`;
import { config } from './config.js';
const apiHost = config.apiHost;

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

async function fetchCount(type=0, searchTerm) {
    const types = ['count'];
    const url =  `http://${apiHost}/loonwatch/${types[type]}?${searchTerm}`;
    let enc = encodeURI(url);
    try {
        let res = await fetch(enc);
        //console.log(`loonWatchData::fetchCount(${searchTerm}) RAW RESULT:`, res);
        let json = await res.json();
        console.log(`loonWatchData::fetchCount(${searchTerm}) JSON RESULT:`, json);
        json.query = enc;
        return json;
    } catch (err) {
        err.query = enc;
        console.log(`loonWatchData::fetchCount(${searchTerm}) ERROR:`, err);
        return new Error(err)
    }
}
export function loonWatchCountsChartCreate(searchTerm, htmlId) {
    let ele = document.getElementById(htmlId);
    let par = ele.parentElement;
    ele.remove();
    ele = document.createElement('div');
    ele.innerHTML = `<svg id="${htmlId}" width="100%" height="400"></svg>`;
    par.appendChild(ele);
    return loonWatchCountsChart(searchTerm, htmlId);
}

export function loonWatchCountsChart(searchTerm, htmlId) {
    return new Promise((resolve, reject) => {
        fetchCount(0, searchTerm)
            .then(res => {
                if (res.rowCount) {
                    loonWatchChart(res.rows, htmlId);
                    resolve(1);
                } else {
                    reject(0);
                }
            })
            .catch(err => {
                console.log(`ERROR loonWatchCountsChart::fetchCount ERROR: `, err);
                reject(-1);
            })
    })
}

export async function loonWatchChart(data, htmlId) {

    //console.log('loonWatchChart', htmlId, data);
    const ele = document.getElementById(htmlId);
    ele.style.padding = "0px 0px 0px 0px";
    ele.style.margin = "0px 0px 0px 0px";
    //console.log('loonWatchChart parent element:', ele);

    let filter = data[0].Filter ? data[0].Filter : '';

    // Declare the chart dimensions and margins.
    var margin = {top: 15, right: 30, bottom: 30, left: 40};
    var width = 400;// - margin.left - margin.right; var minWidth = width; 
    var height = 200;// - margin.top - margin.bottom;

    // Declare the x (horizontal position) scale.
    const x = d3.scaleUtc(d3.extent(data, d => Number(d.year)), [margin.left, width - margin.right]);
  
    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear([0, d3.max(data, d => Number(d.Adults))], [height - margin.bottom, margin.top]);
  
    // Declare the line generator.
    const line = d3.line()
        .x(d => x(Number(d.year)))
        .y(d => y(Number(d.Adults)));
  
    // Create the SVG container.
    //const svg = d3.create("svg")
    // Select the HTML or SVG container. Container must be svg tag like <svg></svg>, or we must call .append("svg") below
    const svg = d3.select(`#${htmlId}`)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
    var xtnt = d3.extent(data, d => Number(d.year));
    console.log('d3.extent:', xtnt, 'd3.scaleUtc:', x);
    var numYears = xtnt[1] - xtnt[0];

    // Add the x-axis.
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(numYears,'y')
        //.call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0)
        );
  
    // Add the y-axis, remove the domain line, add grid lines and a label.
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(height / 40))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - margin.left - margin.right)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", margin.left)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(`LoonWatch Counts - ${filter}`));
  
    // Append a path for the line.
    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line(data));
    
    //return svg.node();
  }