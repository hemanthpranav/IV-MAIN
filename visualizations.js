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

function createTreemap(data) {
  const container = d3.select("#treemap");
  container.selectAll("*").remove();

  if (data.length === 0) {
    container.append("p").text("No data matching filters");
    return;
  }

  // Set dimensions and margins
  const width = 800;
  const height = 500;
  const margin = { top: 10, right: 10, bottom: 10, left: 10 };

  // Create SVG
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Process data: Hierarchy = Origin > Manufacturer > Cylinders
  const root = d3.hierarchy({
    name: "root",
    children: d3.groups(data, d => d.Origin, d => d.Manufacturer, d => d.Cylinders)
      .map(([origin, manufacturers]) => ({
        name: origin,
        children: manufacturers.map(([manufacturer, cylinders]) => ({
          name: manufacturer,
          children: cylinders.map(([cylinder, items]) => ({
            name: `${cylinder}-cyl`,
            value: d3.mean(items, d => d.MPG), // Size by average MPG
            count: items.length,
            items: items
          }))
        }))
      }))
    })
    .sum(d => d.value || 0) // Required for treemap
    .sort((a, b) => b.value - a.value);

  // Color scale by origin
  const color = d3.scaleOrdinal()
    .domain(["American", "European", "Japanese"])
    .range(["#e41a1c", "#377eb8", "#4daf4a"]);

  // Create treemap layout
  const treemap = d3.treemap()
    .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
    .padding(1);

  treemap(root);

  // Create cells
  const cell = svg.selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  // Add rectangles
  cell.append("rect")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => color(d.parent.parent.data.name))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("stroke-width", 2);
      tooltip.style("visibility", "visible")
        .html(`
          <strong>${d.parent.data.name}</strong><br>
          Cylinders: ${d.data.name}<br>
          Avg MPG: ${d.data.value.toFixed(1)}<br>
          Cars: ${d.data.count}
        `);
    })
    .on("mousemove", event => {
      tooltip.style("top", (event.pageY - 10) + "px")
             .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("stroke-width", 1);
      tooltip.style("visibility", "hidden");
    });

  // Add text labels (only if space permits)
  cell.filter(d => (d.x1 - d.x0) > 40 && (d.y1 - d.y0) > 20)
    .append("text")
    .attr("x", 5)
    .attr("y", 15)
    .text(d => `${d.parent.data.name.slice(0, 10)}: ${d.data.value.toFixed(1)}`)
    .attr("font-size", "10px")
    .attr("fill", "white");

  // Add legend
  const legend = svg.append("g")
    .attr("transform", `translate(10, 10)`);

  ["American", "European", "Japanese"].forEach((origin, i) => {
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(origin));

    legend.append("text")
      .attr("x", 20)
      .attr("y", i * 20 + 12)
      .text(origin)
      .attr("font-size", "12px");
  });

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "white")
    .style("padding", "5px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "3px");
}

// CSS for tooltip (add to your stylesheet)
.tooltip {
  font-family: sans-serif;
  font-size: 12px;
  pointer-events: none;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadData);
  
   
