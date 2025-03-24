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
          Origin: d.Origin,
          Cylinders: d.Cylinders === "NA" ? null : +d.Cylinders,
          Acceleration: d.Acceleration === "NA" ? null : +d.Acceleration,
          Displacement: d.Displacement === "NA" ? null : +d.Displacement
        };
      }).filter(function(d) {
        return d.MPG !== null && d.Horsepower !== null && d.Weight !== null && d.Acceleration !== null;
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
  manufacturerSelect.selectAll("option").remove();
  manufacturerSelect.append("option")
    .attr("value", "all")
    .text("All Manufacturers");
    
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
  originSelect.selectAll("option").remove();
  originSelect.append("option")
    .attr("value", "all")
    .text("All Origins");
    
  origins.forEach(function(origin) {
    originSelect.append("option")
      .attr("value", origin)
      .text(origin);
  });

  // Cylinders filter
  var cylinders = Array.from(new Set(rawData.map(function(d) { 
    return d.Cylinders; 
  }))).sort(function(a, b) { return a - b; });
  
  var cylindersSelect = d3.select("#cylinders-filter");
  cylindersSelect.selectAll("option").remove();
  cylindersSelect.append("option")
    .attr("value", "all")
    .text("All Cylinders");
    
  cylinders.forEach(function(cyl) {
    cylindersSelect.append("option")
      .attr("value", cyl)
      .text(cyl);
  });

  // Set up event listeners
  d3.selectAll("select").on("change", applyFilters);
}

// Apply all active filters
function applyFilters() {
  var manufacturer = d3.select("#manufacturer-filter").property("value");
  var origin = d3.select("#origin-filter").property("value");
  var cylinders = d3.select("#cylinders-filter").property("value");

  filteredData = rawData.filter(function(d) {
    return (manufacturer === "all" || d.Manufacturer === manufacturer) &&
           (origin === "all" || d.Origin === origin) &&
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
  createBubbleChart(filteredData);
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

// Bubble Chart: Acceleration vs MPG by Origin
function createBubbleChart(data) {
  var container = d3.select("#bubble-chart");
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

  // Color scale for origins
  var color = d3.scaleOrdinal()
    .domain(["American", "European", "Japanese"])
    .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

  // Scales
  var x = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return d.MPG; })])
    .range([0, width]);

  var y = d3.scaleLinear()
    .domain([d3.min(data, function(d) { return d.Acceleration; }), 
             d3.max(data, function(d) { return d.Acceleration; })])
    .range([height, 0]);

  // Size scale for bubbles based on weight
  var size = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.Weight; }))
    .range([3, 15]);

  // Add bubbles
  svg.selectAll(".bubble")
    .data(data)
    .enter().append("circle")
    .attr("class", "bubble")
    .attr("cx", function(d) { return x(d.MPG); })
    .attr("cy", function(d) { return y(d.Acceleration); })
    .attr("r", function(d) { return size(d.Weight); })
    .attr("fill", function(d) { return color(d.Origin); })
    .attr("opacity", 0.7)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1);

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
    .text("MPG");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .text("Acceleration (seconds to 60mph)");

  // Add legend
  var legend = svg.selectAll(".legend")
    .data(color.domain())
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) { 
      return "translate(0," + i * 20 + ")"; 
    });

  legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color);

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(function(d) { return d; });

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Acceleration vs MPG by Origin (Bubble Size = Weight)");
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadData);
