// Global variables
var rawData = [];
var filteredData = [];

// Main data loader
function loadData() {
  d3.csv("https://raw.githubusercontent.com/hemanthpranav/IV-MAIN/main/a1-cars.csv")
    .then(function(data) {
      // Process data
      rawData = data.map(function(d) {
        return {
          Car: d.Car,
          Manufacturer: d.Manufacturer,
          MPG: d.MPG === "NA" ? null : +d.MPG,
          Horsepower: d.Horsepower === "NA" ? null : +d.Horsepower,
          Weight: d.Weight === "NA" ? null : +d.Weight,
          Model_Year: d.Model_Year === "NA" ? null : +d.Model_Year,
          Origin: d.Origin,
          Cylinders: d.Cylinders === "NA" ? null : +d.Cylinders
        };
      }).filter(function(d) {
        return d.MPG !== null && d.Horsepower !== null && d.Weight !== null;
      });

      console.log("Data loaded successfully");
      
      // Initialize filters
      initFilters();
      
      // Apply initial filters
      applyFilters();
    })
    .catch(function(error) {
      console.error("Error loading data:", error);
      document.getElementById("bar-chart").innerHTML = 
        '<p style="color:red">Error loading data. Check console.</p>';
    });
}

// Initialize filter dropdowns
function initFilters() {
  // Manufacturer filter
  var manufacturers = Array.from(new Set(rawData.map(function(d) { 
    return d.Manufacturer; 
  }))).sort();
  
  var manufacturerSelect = d3.select("#manufacturer-filter");
  manufacturers.forEach(function(mfg) {
    manufacturerSelect.append("option")
      .attr("value", mfg)
      .text(mfg);
  });

  // Origin filter
  var origins = Array.from(new Set(rawData.map(function(d) { 
    return d.Origin; 
  }))).sort();
  
  var originSelect = d3.select("#origin-filter");
  origins.forEach(function(origin) {
    originSelect.append("option")
      .attr("value", origin)
      .text(origin);
  });

  // Year filter
  var years = Array.from(new Set(rawData.map(function(d) { 
    return d.Model_Year; 
  }))).sort(function(a, b) { return a - b; });
  
  var yearSelect = d3.select("#year-filter");
  years.forEach(function(year) {
    yearSelect.append("option")
      .attr("value", year)
      .text(year);
  });

  // Set up event listeners
  d3.selectAll("select").on("change", applyFilters);
}

// Apply all active filters
function applyFilters() {
  var manufacturer = d3.select("#manufacturer-filter").property("value");
  var origin = d3.select("#origin-filter").property("value");
  var year = d3.select("#year-filter").property("value");
  var cylinders = d3.select("#cylinders-filter").property("value");

  filteredData = rawData.filter(function(d) {
    return (manufacturer === "all" || d.Manufacturer === manufacturer) &&
           (origin === "all" || d.Origin === origin) &&
           (year === "all" || d.Model_Year == year) &&
           (cylinders === "all" || d.Cylinders == cylinders);
  });

  console.log("Filtered data points:", filteredData.length);
  
  // Update visualizations
  updateVisualizations();
}

// Update all charts with filtered data
function updateVisualizations() {
  createBarChart(filteredData);
  createScatterPlot(filteredData);
  createLineChart(filteredData);
}

// Bar Chart: MPG by Manufacturer
function createBarChart(data) {
  var container = d3.select("#bar-chart");
  container.selectAll("*").remove();

  if (data.length === 0) {
    container.append("p").text("No data matching filters");
    return;
  }

  // Increased bottom margin for rotated labels
  var margin = {top: 40, right: 30, bottom: 100, left: 60};
  var width = 800 - margin.left - margin.right;
  var height = 400 - margin.top - margin.bottom;

  var svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Group data by Manufacturer
  var manufacturers = Array.from(new Set(data.map(function(d) { 
    return d.Manufacturer; 
  }))).sort();

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

  // Add X axis with rotated labels
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-0.8em")
    .attr("dy", "0.15em")
    .attr("transform", "rotate(-45)");

  // Add Y axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // Add Y axis label
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

  if (data.length === 0) {
    container.append("p").text("No data matching filters");
    return;
  }

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

function createHeatmap(data) {
  // Remove any existing heatmap
  d3.select("#heatmap").selectAll("*").remove();

  // Set dimensions and margins
  const margin = {top: 50, right: 30, bottom: 80, left: 60};
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Extract unique years and cylinders
  const years = Array.from(new Set(data.map(d => d.Model_Year))).sort(d3.ascending);
  const cylinders = [4, 6, 8];

  // Color scale
  const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([0, d3.max(data, d => d.MPG)]);

  // Create scales
  const x = d3.scaleBand()
    .domain(years)
    .range([0, width])
    .padding(0.05);

  const y = d3.scaleBand()
    .domain(cylinders)
    .range([height, 0])
    .padding(0.05);

  // Group data by year and cylinders
  const groupedData = d3.rollups(
    data,
    v => d3.mean(v, d => d.MPG),
    d => d.Model_Year,
    d => d.Cylinders
  );

  // Create heatmap cells
  svg.selectAll()
    .data(groupedData)
    .enter()
    .selectAll()
    .data(d => d[1].map(e => ({
      year: d[0],
      cylinders: e[0],
      value: e[1],
      count: e[1].length
    })))
    .enter()
    .append("rect")
    .attr("class", "heatmap-cell")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.cylinders))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => isNaN(d.value) ? "#eee" : colorScale(d.value))
    .on("mouseover", function(event, d) {
      d3.select(this).attr("stroke", "#333");
      
      // Show tooltip
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .html(`
          Year: ${d.year}<br>
          Cylinders: ${d.cylinders}<br>
          Avg MPG: ${d.value ? d.value.toFixed(1) : 'N/A'}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 15) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("stroke", "#fff");
      d3.selectAll(".tooltip").remove();
    });

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg.append("g")
    .call(d3.axisLeft(y));

  // Add axis labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 50)
    .style("text-anchor", "middle")
    .text("Model Year");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .text("Cylinders");

  // Add color legend
  const legendWidth = 200;
  const legendHeight = 20;
  const legend = svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 10}, -30)`);

  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "color-gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

  [0, 0.5, 1].forEach(ratio => {
    gradient.append("stop")
      .attr("offset", `${ratio * 100}%`)
      .attr("stop-color", colorScale(ratio * d3.max(data, d => d.MPG)));
  });

  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#color-gradient)");

  legend.append("text")
    .attr("x", legendWidth / 2)
    .attr("y", -5)
    .style("text-anchor", "middle")
    .text("Average MPG");
}

// CSS for tooltip (add to your stylesheet)
.tooltip {
  font-family: sans-serif;
  font-size: 12px;
  pointer-events: none;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadData);
  
   
