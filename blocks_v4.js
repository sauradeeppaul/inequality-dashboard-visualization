var margin = {top: 0, right: 0, bottom: 0, left: 0},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;


var current_year = '2017' 


var minYear = 2500;
var maxYear = 1500;

var svg;


function initialize(){
  // console.log("v1")
  // render_map_plot();

  svg = d3.select("svg")
            .attr("width", width)
            .attr("height", height)
            .append('g')
            .attr('class', 'map');

  console.log("v2");
  render_plot();
}


function render_plot(){

  // d3.selectAll("svg > *").remove();
  render_map_plot_v2();
}


function render_scatter_plot(){
  // parse the date / time
  var parseTime = d3.timeParse("%d-%b-%y");

  // set the ranges
  var x = d3.scaleTime().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);

  // define the line
  var valueline = d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.close); });

  // append the svg obgect to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  // Get the data
  d3.csv("https://raw.githubusercontent.com/sauradeeppaul/inequality-dashboard-visualization/master/data/cereals.csv?token=AC5RIEKHQNPZIWU6XF4LYC24Y7CO2", function(error, data) {
    if (error) throw error;

    // format the data
    data.forEach(function(d) {
        d.date = parseTime(d.date);
        d.close = +d.close;
    });

    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.close; })]);

    // Add the valueline path.
    svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", valueline);
        
    // Add the scatterplot
    svg.selectAll("dot")
        .data(data)
      .enter().append("circle")
        .attr("r", 5)
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(d.close); });

    // Add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

  });

}


function render_map_plot_v2(){
  var format = d3.format(",");

  var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              console.log(d)
              return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br>" + parseFloat(d.val).toFixed(2) +"</span>";
            })

  var path = d3.geoPath();


  var projection = d3.geoMercator()
                     .scale(130)
                    .translate( [width / 2, height / 1.5]);

  var path = d3.geoPath().projection(projection);

  svg.call(tip);

  queue()
    .defer(d3.json, "https://raw.githubusercontent.com/sauradeeppaul/inequality-dashboard-visualization/master/data/world_countries_features.json")
    .defer(d3.csv, "https://raw.githubusercontent.com/sauradeeppaul/inequality-dashboard-visualization/master/visualization%20source%20data/gdp-per-capita-worldbank.csv")
    .await(ready);

  function ready(error, country_features, data) {
    if (error) throw error; 

    var data_column = 'val';

    var populationByCountry = {};

    console.log(data);

    var minVal = 1000000;
    var maxVal = 0;

    data.forEach(function(d) { 
      if (populationByCountry[d['Year']] == undefined || populationByCountry[d['Year']].length == 0)
        populationByCountry[d['Year']] = {};

      minYear = Math.min(minYear, parseInt(d['Year']));
      maxYear = Math.max(maxYear, parseInt(d['Year']));

      populationByCountry[d['Year']][d['Code']] = d[data_column]; 

      if(d['Year'] == current_year){
        minVal = Math.min(minVal, parseInt(d[data_column]));
        maxVal = Math.max(maxVal, parseInt(d[data_column]));
      }});


    country_features.features.forEach(function(d) { d.val = populationByCountry[current_year][d.id] });

    console.log(populationByCountry);
    console.log("Min Year: " + minYear);
    console.log("Max Year: " + maxYear);

    console.log("Min Val: " + minVal);
    console.log("Max Val: " + maxVal);

    document.getElementById("slider").oninput = function() {
      var val = document.getElementById("slider").value
      var slidermin = document.getElementById("slider").min
      var slidermax = document.getElementById("slider").max
      console.log(val)

      current_year = minYear + Math.floor((maxYear-minYear)*(val-slidermin)/(slidermax - slidermin))
      render_plot();
    };

    var color = d3.scaleLinear()
    .domain([minVal, Math.sqrt(minVal*maxVal), maxVal])
    .range(["rgb(242, 52, 19)", "rgb(244, 244, 9)", "rgb(44, 186, 44)"]);

    // console.log("Population By Country")
    // console.log(populationByCountry)


    svg.append("g")
      .attr("class", "countries")
      .selectAll("path")
        .data(country_features.features)
      .enter().append("path")
        .attr("d", path)
        .style("fill", function(d) {
          // console.log("V2 stuff: ")
          // console.log(d);
          var c = color(populationByCountry[current_year][d.id])
          // console.log(populationByCountry[current_year][d.id])
          // console.log(c);
          return c; })
        .style('stroke', 'white')
        .style('stroke-width', 1.5)
        .style("opacity",0.8)
        // tooltips
          .style("stroke","white")
          .style('stroke-width', 0.3)
          .on('mouseover',function(d){
            tip.show(d);

            d3.select(this)
              .style("opacity", 1)
              .style("stroke","white")
              .style("stroke-width",3);
          })
          .on('mouseout', function(d){
            tip.hide(d);

            d3.select(this)
              .style("opacity", 0.8)
              .style("stroke","white")
              .style("stroke-width",0.3);
          });

    svg.append("path")
        .datum(topojson.mesh(country_features.features, function(a, b) { return a.id !== b.id; }))
         // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
        .attr("class", "names")
        .attr("d", path);

    console.log("Map plotted for " + current_year);

  }
}