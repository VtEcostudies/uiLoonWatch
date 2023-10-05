
import { fetchCount } from './loonWatchData.js';

// set the dimensions and margins of the graph
const margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
/*
//Read the data
d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/3_TwoNumOrdered_comma.csv",

  // When reading the csv, I must format variables:
  function(d){
    return { date : d3.timeParse("%Y-%m-%d")(d.date), value : d.value }
  }).then( 
  // Now I can use this dataset:
  function(data) {
*/
fetchCount(0)
  .then(res => {
    let data = res.rows;

    // Add X axis --> it is a date format
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => { return new Date(d.year, 0);}))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return +d.Adults; })])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));

    // Add the line - Adults
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(function(d) { return x(new Date(d.year,0)) })
        .y(function(d) { return y(d.Adults) })
        )

    // Append a path to fill under the line - Adults
    svg.append("path")
    .datum(data)
    .attr("fill", "#69b3a2")
        .attr("fill-opacity", .3)
        .attr("stroke", "none")
        .attr("d", d3.area()
          .x((d) => { return x(new Date(d.year,0)) })
          .y0( height )
          .y1((d) => { return y(d.Adults) })
          )

    // Add individual data points - Adults
    svg.selectAll("myCircles")
      .data(data)
      .join("circle")
        .attr("fill", "steelblue")
        .attr("stroke", "none")
        .attr("cx", d => x(new Date(d.year,0)))
        .attr("cy", d => y(d.Adults))
        .attr("r", 3)


    // Add a line - Chicks
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x((d) => { return x(new Date(d.year,0)) })
          .y((d) => { return y(d.Chicks) })
          )

    // Add individual data points - Chicks
    svg.selectAll("myCircles")
      .data(data)
      .join("circle")
        .attr("fill", "black")
        .attr("stroke", "none")
        .attr("cx", d => x(new Date(d.year,0)))
        .attr("cy", d => y(d.Chicks))
        .attr("r", 3)
 
    // append the bar rectangles to the svg element
    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => {return x(new Date(d.year,0))-2})
        .attr("y", d => y(d.SurveyedBodies)) //the location of the TOP of the bar
        .attr("width", function(d) { return 4; })
        .attr("height", function(d) { return height - y(d.SurveyedBodies); }) //how far DOWN the bar must extend to reach the bottom axis
        .style("fill", "red")
        .attr("fill-opacity", 0.3)

    var legend_keys = ["Adults", "Chicks", "SubAdults", "Surveyed"]

    var lineLegend = svg.selectAll(".lineLegend").data(legend_keys)
        .enter().append("g")
        .attr("class","lineLegend")
        .attr("transform", function (d,i) {
                return "translate(" + margin.left + "," + (i*20)+")";
            });
    
    lineLegend.append("text").text(function (d) {return d;})
        .attr("transform", "translate(15,9)"); //align texts with boxes
    
    lineLegend.append("rect")
        .attr("fill", function (d, i) {
            console.log(d, i);
            switch(d) {
                case 'Adults': return "steelblue";
                case 'Chicks': return "green";
                case 'SubAdults': return "gray";
                case 'Surveyed': return "red";
            }
        })
        .attr("width", 10).attr("height", 10);
    
})