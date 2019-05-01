var margin = {top: 0, right: 0, bottom: 0, left: 0},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;


var current_year = '2017'


var minYear = 2500;
var maxYear = 1500;

var svg;


var map_features = ["GDP per Capita", "Life Expectancy"];
var current_feature;


function initialize(){
  // console.log("v1")
  // render_map_plot();

  current_feature = map_features[0];

  prepare_dropdown();

  prepare_modal();

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


function render_scatter_plot(data){
  // parse the date / time
  console.log("Data for line chart!")
  console.log(data)
  d3.select("svg").selectAll("*").remove();
  // set the ranges
  var time_data = d3.entries(data);
  console.log(time_data)

  var xScale = d3.scaleLinear()
             .rangeRound([0, width])
             .domain([0, d3.max(time_data, (function (d) {
               return d.key;
             }))]);
 var  yScale = d3.scaleLinear()
              .rangeRound([height, 0])
              .domain([0, d3.max(time_data, (function (d) {
                return d.value;
              }))]);


  var g = svg.append("g")


            g.append("text")
             .attr("x", (width / 2))
             .attr("y", 0 - (margin.top / 2))
             .attr("text-anchor", "middle")
             .style("font-size", "16px")
             .style("text-decoration", "underline")
             .text("Time Series Data");

            // axis-x
            g.append("g")
              .attr("transform", "translate(0," + height + ")")
              .call(d3.axisBottom(xScale).ticks(d3.max(data, (function (d) {
                return d.value;
              }))))

              .append("text")
              .attr("y", height)
              .attr("x", 10)
              .attr("text-anchor", "end")
              .attr("stroke", "black")
              .text("K values");

            // axis-y
            g.append("g")
                //.attr("class", "axis axis--y")
                .call(d3.axisLeft(yScale));

  var line = d3.line()
      .x(function(d, i) { return xScale(d.key); })
      .y(function(d) { return yScale(d.value); })
      .curve(d3.curveMonotoneX);

  g.append("path")
    .attr("class", "line") // Assign a class for styling
    .attr("d", line(time_data)); // 11. Calls the line generator

  g.selectAll(".dot")
    .data(time_data)
    .enter().append("circle") // Uses the enter().append() method
    .attr("class", "dot") // Assign a class for styling
    .attr("cx", function(d) { return xScale(d.key) })
    .attr("cy", function(d) { return yScale(d.value) })
    .attr("r", 5);



}


function render_map_plot_v2(){
  var format = d3.format(",");

  var csv_file;

  if (current_feature == map_features[0]){
    csv_file = "https://raw.githubusercontent.com/sauradeeppaul/inequality-dashboard-visualization/master/visualization%20source%20data/gdp-per-capita-worldbank.csv";
  } else if(current_feature == map_features[1]){
    csv_file = "https://raw.githubusercontent.com/sauradeeppaul/inequality-dashboard-visualization/master/visualization%20source%20data/life-expectancy.csv"
  }

  console.log("Loading data from " + csv_file);

  var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              console.log(d)
              return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br><strong>" + current_feature + ": </strong><span class='details'>" + parseFloat(d.val).toFixed(2) +"</span>";
            })

  var path = d3.geoPath();


  var projection = d3.geoMercator()
                     .scale(130)
                    .translate( [width / 2, height / 1.5]);

  var path = d3.geoPath().projection(projection);

  svg.call(tip);

  queue()
    .defer(d3.json, "https://raw.githubusercontent.com/sauradeeppaul/inequality-dashboard-visualization/master/data/world_countries_features.json")
    .defer(d3.csv, csv_file)
    .await(ready);

  function ready(error, country_features, data) {
    if (error) throw error;

    var data_column = 'val';

    var populationByCountry = {};

    console.log(data);

    var minVal = 1000000;
    var maxVal = 0;

    var timeSeries = {};

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

      data.forEach(function(d) {
        if (timeSeries[d['Code']] == undefined || timeSeries[d['Code']].length == 0)
          timeSeries[d['Code']] = {};

          timeSeries[d['Code']][d['Year']] = d[data_column];

        });


    country_features.features.forEach(function(d) {
      console.log("loading to features:")
      console.log(d)
      d.val = populationByCountry[current_year][d.id] });

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
          })
          .on("click", function(d){
            tip.hide(d);
            render_scatter_plot(timeSeries[d.id]);
          })

    svg.append("path")
        .datum(topojson.mesh(country_features.features, function(a, b) { return a.id !== b.id; }))
         // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
        .attr("class", "names")
        .attr("d", path);

    console.log("Map plotted for " + current_year);

  }
}


function prepare_dropdown() {
  console.log("F:prepareDropdown()")

  var dropdownChange = function () {
    console.log("-------------------------------------------------------")
    console.log("F:dropdownChange()")

    var new_feature = d3.select(this).property('value');
    current_feature = new_feature;
    render_plot();
    console.log("Field:", current_feature);
  };

  dropdown = d3.select("#dropdown")
    .insert("select", "svg")
    .on("change", dropdownChange);

  dropdown.selectAll("option")
    .data(map_features)
    .enter().append("option")
    .attr("value", function (d) {
      return d;
    })
    .text(function (d) {
      return d[0].toUpperCase() + d.slice(1, d.length);
    });
}


function prepare_modal(){
  // Get the modal
  var modal = document.getElementById('myModal');

  // Get the button that opens the modal
  var pca_btn = document.getElementById("pca_button");
  var sim_btn = document.getElementById("sim_button");

  // Get the <span> element that closes the modal
  // var span = document.getElementById("close");

  // console.log(span)

  // When the user clicks on the button, open the modal
  pca_btn.onclick = function() {
    console.log("PCA")
    modal.style.display = "block";
  }

  sim_btn.onclick = function() {
    console.log("Similarity")
    modal.style.display = "block";
  }


  // When the user clicks on <span> (x), close the modal
  // span.onclick = function() {
  //   modal.style.display = "none";
  // }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
}
