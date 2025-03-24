// Main data loader function
function loadData() {
  d3.csv("https://raw.githubusercontent.com/hemanthpranav/IV-MAIN/main/a1-cars.csv")
    .then(function(rawData) {
      // Process data without spread operator
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
        return d.MPG !== null && d.Horsepower !== null && d.Weight !== null;
      });

      console.log("Data processed successfully");
      
      // Create visualizations
      createBarChart(cleanData);
      createScatterPlot(cleanData);
      createLineChart(cleanData);
    })
    .catch(function(error) {
      console.error("Error loading data:", error);
      document.getElementById("bar-chart").innerHTML = 
        '<p style="color:red">Error loading data. Check console.</p>';
    });
}

// Bar Chart: MPG by Manufacturer
function createBarChart(data) {
  var container = d3.select("#bar-chart");
  container.selectAll("*").remove();

  var margin = {top: 40, right: 30, bottom: 70, left: 60};
  var width = 800 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;

  var svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Group data by Manufacturer
  var manufacturers = [];
  data.forEach(function(d) {
    if (manufacturers.indexOf(d.Manufacturer) === -1) {
      manufacturers.push(d.Manufacturer);
    }
  });

  // Calculate average MPG
  var avgMPG = manufacturers.map(function(mfg) {
    var mfgData = data.filter(function(d) { return d.Manufacturer === mfg; });
    return {
      Manufacturer: mfg,
      MPG: d3.mean(mfgData, function(d) { return d.MPG; })
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

// Line Chart: Weight Evolution Over Years (using d3.rollups)
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

  // 1. Filter out invalid years and weights
  var validData = data.filter(function(d) {
    return !isNaN(d.Model_Year) && !isNaN(d.Weight) && d.Weight !== null;
  });

  // 2. Group data by year with additional validation
  var groupedData = d3.rollups(
    validData,
    function(v) { 
      var weights = v.map(function(d) { return d.Weight; }).filter(function(w) { return !isNaN(w); });
      return weights.length > 0 ? d3.mean(weights) : 0;
    },
    function(d) { return d.Model_Year; }
  ).filter(function(d) {
    return !isNaN(d[0]) && !isNaN(d[1]); // Filter out NaN groups
  });

  // 3. Sort by year and ensure numeric values
  groupedData.sort(function(a, b) {
    return a[0] - b[0];
  }).map(function(d) {
    return [Number(d[0]), Number(d[1])];
  });

  // 4. Verify we have valid data points
  if (groupedData.length === 0) {
    console.error("No valid data points for line chart");
    svg.append("text")
      .attr("x", width/2)
      .attr("y", height/2)
      .text("No valid data available");
    return;
  }

  // 5. Set scales with fallback domains
  var x = d3.scaleLinear()
    .domain([
      d3.min(groupedData, function(d) { return d[0]; }) || 0,
      d3.max(groupedData, function(d) { return d[0]; }) || 1
    ])
    .range([0, width]);

  var y = d3.scaleLinear()
    .domain([
      Math.min(0, d3.min(groupedData, function(d) { return d[1]; }) || 0),
      d3.max(groupedData, function(d) { return d[1]; }) || 1
    ])
    .range([height, 0]);

  // 6. Line generator with validation
  var line = d3.line()
    .defined(function(d) { return !isNaN(d[0]) && !isNaN(d[1]); })
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); });

  // 7. Draw the line
  svg.append("path")
    .datum(groupedData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Rest of your axis code...
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width/2)
    .attr("y", height + margin.bottom - 10)
    .style("text-anchor", "middle")
    .text("Model Year");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height/2)
    .style("text-anchor", "middle")
    .text("Average Weight");
}
// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadData);
    
