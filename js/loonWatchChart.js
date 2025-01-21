
import { fetchCount } from './loonWatchData.js';
import { capitalize } from './utils.js';

//on startup, parse query params and display
const reqQry = new URLSearchParams(window.location.search);
let search = parseURLParams(reqQry);
loonWatchCountsChartReplace(search, 'chartDiv');

//on message, parse query params and re-display
window.addEventListener("message", e => {
  if ('loonwatch-search'==e.data.source || 'loonwatch-map'==e.data.source) {
    console.log('loonWatchChart.js received message', e.data);
    let objQry = e.data.params;
    let urlQry = new URLSearchParams(objQry);
    let search = parseURLParams(urlQry);
    loonWatchCountsChartReplace(search, 'chartDiv');
  }
})

export function parseURLParams(reqQry) {
  let lakeId = reqQry.get('LAKEID') ? reqQry.get('LAKEID') : reqQry.get('exportname');
  let townName = reqQry.get('townName');
  let cntyName = reqQry.get('countyName');
  let search = '';
  if (cntyName) {search = `countyName=${cntyName}`;}
  if (townName) {search = `townName=${capitalize(townName)}`;}
  if (lakeId) {search = `exportname=${lakeId}`;}
  return search;
}

/*
Lake/Pond Dashboard definitions:
  - LoonWatch Counts
  - Nesting and Territorial Stats
    - Time-series
    - Most recent
  - Volunteer Stats 
    - # visits this year
    - sightings, most recent sighting
*/

/*
Town Dashboard definitions:
- LoonWatch Counts
- Nesting and Territorial Stats
- List of WaterBodies
  - Surveyed/most recent year
  - Occupied/most recent year
  - Nesting/most recent year
*/

export function loonWatchCountsChartCreate(searchTerm='', htmlId) {
  return loonWatchCountsChartReplace(searchTerm, htmlId);
}

export function loonWatchCountsChartReplace(searchTerm='', htmlId) {
  let ele = document.getElementById(htmlId);
  if (ele) {
    ele.innerHTML = '';
    return loonWatchCountsChart(searchTerm, htmlId);
  } else {
    console.log(`loonWatchChart.js=>loonWatchCountsReplace element ID ${htmlId} not found.`)
  }
}

export async function loonWatchCountsChart(searchTerm, htmlId) {
  let ele = document.getElementById(htmlId);
  try {
      let res = await fetchCount(searchTerm)
      if (res.rowCount) {
          loonWatchChart(res.rows, htmlId, searchTerm);
      } else {
        if (ele) {ele.innerHTML = `<h3>No LoonWatch Data (${searchTerm})</h3>`;}
      }
          return res.rowCount;
  } catch(err) {
      console.log(`ERROR loonWatchCountsChart::fetchCount ERROR: `, err);
      throw new Error(err);
  }
}

export async function loonWatchChart(data, htmlId, search) {

  console.log('loonWatchChart', htmlId, search, data);
  let searchLevel = search.split('=')[0];
  let searchValue = search.split('=')[1];
  const ele = document.getElementById(htmlId);
  ele.style.padding = "0px 0px 0px 0px";
  ele.style.margin = "0px 0px 0px 0px";
  console.log('loonWatchChart parent element:', ele, ele.style.width, ele.style.height);
  let parHyt = parseInt(ele.style.height);
  let parWid = parseInt(ele.style.width);

  let filter = data[0].Filter ? data[0].Filter : 'State of VT';
  filter = filter.replace('WHERE', '');
  filter = filter.replace('LIKE', '');
  filter = filter.replace('%', '');
  filter = filter.replace(/"/g, '');
  filter = filter.replace('exportname', 'Water Body ID:');
  filter = filter.replace('Name', '');
  filter = filter.replace('=', '');

  // Declare the chart dimensions and margins.
  const width = parWid; //400;// - margin.left - margin.right; var minWidth = width; 
  const height = parHyt; //200;// - margin.top - margin.bottom;
  const margin = {top: 70, right: 30, bottom: 30, left: width/20};

  const adColor = "steelblue";
  const chColor = "green";
  const saColor = "gray";
  const svColor = "red";
  var fontSize = width/60;
  fontSize = fontSize < 9 ? 9 : fontSize; //set a minimum

  // Declare the x (horizontal position) scale. (NOTE: function below MUST have explicit 'return new Date...')
  const x = d3.scaleUtc(d3.extent(data, d => {return new Date(d.year, 0)}), [margin.left, width - margin.right]);

  let svMax = d3.max(data, d => Number(d.SurveyedBodies));
  let adMax = d3.max(data, d => Number(d.Adults));

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([0, adMax>svMax?adMax:svMax], [height - margin.bottom, margin.top]);

  // Declare the line generator.
  const line = d3.line()
      .x(d => x(new Date(d.year, 0)))
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

  svg.on("click", () => {location.assign(`${config.uiHost}/chart.html?${search}`)});

  // Add the x-axis.
  svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
      .style("font", `${fontSize}px Arial`);

  const yAxisTicks = y.ticks()
      .filter(tick => Number.isInteger(tick));
  const yAxis = d3.axisLeft(y)
      .tickValues(yAxisTicks)
      .tickFormat(d3.format('d'));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      //.call(d3.axisLeft(y).ticks(height / 40))
      .call(yAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", width - margin.left - margin.right)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", width/4)
          .attr("y", height/15)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(`LoonWatch Counts - ${filter}`))
          .style("font", `${fontSize}px Arial`)
          .style("font-weight", "bold");

  // Append a path for the line.
  svg.append("path")
      .attr("fill", "none")
      .attr("stroke", adColor)
      .attr("stroke-width", 1.5)
      .attr("d", line(data));
  // Append a path to fill under the line - Adults
  svg.append("path")
      .datum(data)
      .attr("fill", adColor)
      .attr("fill-opacity", .3)
      .attr("stroke", "none")
      .attr("d", d3.area()
        .x((d) => { return x(new Date(d.year,0)) })
        .y0( height - margin.bottom )
        .y1((d) => { return y(d.Adults) })
        )


  // Add individual data points - Adults
  svg.selectAll("myCircles")
    .data(data)
    .join("circle")
      .attr("fill", adColor)
      .attr("stroke", "none")
      .attr("cx", d => x(new Date(d.year,0)))
      .attr("cy", d => y(d.Adults))
      .attr("r", 3)

  // Add a line - Chicks
  svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", chColor)
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x((d) => { return x(new Date(d.year,0)) })
        .y((d) => { return y(d.Chicks) })
        )
  // Append a path to fill under the line - Chicks
  svg.append("path")
  .datum(data)
  .attr("fill", chColor)
      .attr("fill-opacity", .3)
      .attr("stroke", "none")
      .attr("d", d3.area()
        .x((d) => { return x(new Date(d.year,0)) })
        .y0( height - margin.bottom )
        .y1((d) => { return y(d.Chicks) })
        )
  // Add individual data points - Chicks
  svg.selectAll("myCircles")
    .data(data)
    .join("circle")
      .attr("fill", chColor)
      .attr("stroke", "none")
      .attr("cx", d => x(new Date(d.year,0)))
      .attr("cy", d => y(d.Chicks))
      .attr("r", 3)

  // Add a line - SubAdults
  svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", saColor)
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x((d) => { return x(new Date(d.year,0)) })
        .y((d) => { return y(d.SubAdults) })
        )
  // Append a path to fill under the line - SubAdults
  svg.append("path")
  .datum(data)
  .attr("fill", saColor)
      .attr("fill-opacity", .3)
      .attr("stroke", "none")
      .attr("d", d3.area()
        .x((d) => { return x(new Date(d.year,0)) })
        .y0( height - margin.bottom )
        .y1((d) => { return y(d.SubAdults) })
        )
  // Add individual data points - SubAdults
  svg.selectAll("myCircles")
    .data(data)
    .join("circle")
      .attr("fill", saColor)
      .attr("stroke", "none")
      .attr("cx", d => x(new Date(d.year,0)))
      .attr("cy", d => y(d.SubAdults))
      .attr("r", 3)

  if ('exportname' != searchLevel) {
      // append bar rectangles to the svg element - SurveyedBodies
      var rect = svg.selectAll("rect")
          .data(data)
          .enter()
          .append("rect")
          .attr("x", d => {return x(new Date(d.year,0))-fontSize/4})
          .attr("y", d => y(d.SurveyedBodies)) //the location of the TOP of the bar
          .attr("width", function(d) { return fontSize/2; })
          .attr("height", function(d) { return height - y(d.SurveyedBodies) - margin.bottom   ; }) //how far DOWN the bar must extend to reach the bottom axis
          .style("fill", svColor)
          .attr("fill-opacity", 0.3)
  }
  
  //rect.on("click", () => {console.log("rect click")});
  //rect.on("mouseover", (d,i) => {console.log("Surveyed Bodies",i.SurveyedBodies)})

  var legend_keys = ["Adults", "Chicks", "SubAdults", "Surveyed Lakes"]
  if ('exportname'==searchLevel) {legend_keys = ["Adults", "Chicks", "SubAdults"]}

  var lineLegend = svg.selectAll(".lineLegend").data(legend_keys)
      .enter().append("g")
      .attr("class","lineLegend")
      .style("font", `${fontSize}px Arial`)
      .attr("transform", function (d,i) {
              return "translate(" + 0 + "," + (i*fontSize)+")";
          });
  
  lineLegend.append("text").text(function (d) {return d;})
      .attr("y", 10)
      .attr("x", width/10+fontSize/2)
      .attr("transform", `translate(10, ${fontSize*0.8})`); //align texts with boxes translate(x, y)
  
  lineLegend.append("rect") //color squares
      .attr("y", 10)
      .attr("x", width/10) //left position offset
      .attr("fill", function (d, i) {
          //console.log(d, i);
          switch(d) {
              case 'Adults': return adColor;
              case 'Chicks': return chColor;
              case 'SubAdults': return saColor;
              case 'Surveyed Lakes': return svColor;
          }
      })
      .attr("width", fontSize*0.8).attr("height", fontSize*0.8)
      .attr("fill-opacity", 0.5);
  
      //return svg.node();
}