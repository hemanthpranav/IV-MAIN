// Main data loader function
function loadData() {
  d3.csv("https://raw.githubusercontent.com/hemanthpranav/IV-MAIN/main/a1-cars.csv")
    .then(function(rawData) {
      // Clean and process data
      var cleanData = rawData.map(function(d) {
        return {
          Car: d.Car,
          Manufacturer: d.Manufacturer,
          MPG: d.MPG === "NA" ? null : +d.MPG,
          Horsepower: d.Horsepower === "NA" ? null : +d.Horsepower,
          Weight: d.Weight === "NA" ? null : +d.Weight,
          Model_Year: d.Model_Year === "NA" ? null : +d.Model_Year,
          Origin: d.Origin
        };
      }).filter(function(d) {
        return d.MPG !== null && d.Horsepower !== null;
      });

      console.log("Data loaded successfully", cleanData);
      
      // Create visualizations
      createBarChart(cleanData);
      createScatterPlot(cleanData);
      createLineChart(cleanData);
    })
    .catch(function(error) {
      console.error("Error loading data:", error);
      document.getElementById("bar-chart").innerHTML = 
        "<p style='color:red'>Error loading data. Check console for details.</p>";
    });
}

// Bar Chart: MPG by Manufacturer
function createBarChart(data) {
  // Clear previous content
  var container = d3.select("#bar-chart");
  container.selectAll("*").remove();

  // Set dimensions
  var margin = {top: 40, right: 30, bottom: 70, left: 60};
  var width = 800 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;

  // Create SVG
  var svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Group data by Manufacturer
  var manufacturers = Array.from(new Set(data.map(function(d) { return d.Manufacturer; })));
  var avgMPG = manufacturers.map(function(m) {
    var manufacturerData = data.filter(function(d) { return d.Manufacturer === m; });
    return {
      Manufacturer: m,
      MPG: d3.mean(manufacturerData, function(d) { return d.MPG; })
    };
  });

  // X scale
  var x = d3.scaleBand()
    .domain(manufacturers)
    .range([0, width])
    .padding(0.2);

  // Y scale
  var y = d3.scaleLinear()
    .domain([0, d3.max(avgMPG, function(d) { return d.MPG; })])
    .nice()
    .range([height, 0]);

  // Add bars
  svg.selectAll(".bar")
    .data(avgMPG)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) { return x(d.Manufacturer); })
    .attr("y", function(d) { return y(d.MPG); })
    .attr("width", x.bandwidth())
    .attr("height", function(d) { return height - y(d.MPG); })
    .attr("fill", "steelblue");

  // Add axes
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Add labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .style("text-anchor", "middle")
    .text("Manufacturer");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .text("Average MPG");
}

// Scatter Plot: Horsepower vs MPG
function createScatterPlot(data) {
  var container = d3.select("#scatter-plot");
  container.selectAll("*").remove();

  var margin = {top: 40, right: 30, bottom: 70, left: 60};
  var width = 600 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;

  var svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Scales
  var x = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.Horsepower; }))
    .range([0, width]);

  var y = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.MPG; }))
    .range([height, 0]);

  // Add dots
  svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", function(d) { return x(d.Horsepower); })
    .attr("cy", function(d) { return y(d.MPG); })
    .attr("r", 5)
    .attr("fill", "steelblue");

  // Add axes
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Add labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .style("text-anchor", "middle")
    .text("Horsepower");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .text("MPG");
}

// Line Chart: Weight Over Years
function createLineChart(data) {
  var container = d3.select("#line-chart");
  container.selectAll("*").remove();

  var margin = {top: 40, right: 30, bottom: 70, left: 60};
  var width = 800 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;

  var svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Group data by year
  var groupedData = d3.nest()
    .key(function(d) { return d.Model_Year; })
    .rollup(function(v) { return d3.mean(v, function(d) { return d.Weight; }); })
    .entries(data);

  // Sort by year
  groupedData.sort(function(a, b) { return a.key - b.key; });

  // Scales
  var x = d3.scaleLinear()
    .domain(d3.extent(groupedData, function(d) { return +d.key; }))
    .range([0, width]);

  var y = d3.scaleLinear()
    .domain(d3.extent(groupedData, function(d) { return d.value; }))
    .range([height, 0]);

  // Line generator
  var line = d3.line()
    .x(function(d) { return x(+d.key); })
    .y(function(d) { return y(d.value); });

  // Add line
  svg.append("path")
    .datum(groupedData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Add axes
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Add labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .style("text-anchor", "middle")
    .text("Model Year");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .text("Average Weight");
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadData);
  
    
