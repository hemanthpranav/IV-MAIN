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
  }))).sort(function(a, b) {
    return a - b;
  });

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

  var margin = {top: 40, right: 30, bottom: 100, left: 60};
  var width = 800 - margin.left - margin.right;
  var height = 400 - margin.top - margin.bottom;

  var svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var manufacturers = Array.from(new Set(data.map(function(d) {
    return d.Manufacturer;
  }))).sort();

  var avgMPG = manufacturers.map(function(mfg) {
    var mfgData = data.filter(function(d) { return d.Manufacturer === mfg; });
    return {
      Manufacturer: mfg,
      MPG: d3.mean(mfgData, function(d) { return d.MPG; })
    };
  });

  var x = d3.scaleBand()
    .domain(manufacturers)
    .range([0, width])
    .padding(0.2);

  var y = d3.scaleLinear()
    .domain([0, d3.max(avgMPG, function(d) { return d.MPG; })])
    .nice()
    .range([height, 0]);

  svg.selectAll(".bar")
    .data(avgMPG)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) { return x(d.Manufacturer); })
    .attr("y", function(d) { return y(d.MPG); })
    .attr("width", x.bandwidth())
    .attr("height", function(d) { return height - y(d.MPG); })
    .attr("fill", "steelblue");

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-0.8em")
    .attr("dy", "0.15em")
    .attr("transform", "rotate(-45)");

  svg.append("g")
    .call(d3.axisLeft(y));

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

  var x = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.Horsepower; }))
    .range([0, width]);

  var y = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.MPG; }))
    .range([height, 0]);

  svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", function(d) { return x(d.Horsepower); })
    .attr("cy", function(d) { return y(d.MPG); })
    .attr("r", 5)
    .attr("fill", "steelblue");

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

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

// Bubble Chart: Horsepower vs MPG with Weight as Bubble Size
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

  var x = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.Horsepower; }))
    .range([0, width]);

  var y = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.MPG; }))
    .range([height, 0]);

  var radiusScale = d3.scaleSqrt()
    .domain(d3.extent(data, function(d) { return d.Weight; }))
    .range([3, 20]);

  svg.selectAll(".bubble")
    .data(data)
    .enter().append("circle")
    .attr("class", "bubble")
    .attr("cx", function(d) { return x(d.Horsepower); })
    .attr("cy", function(d) { return y(d.MPG); })
    .attr("r", function(d) { return radiusScale(d.Weight); })
    .attr("fill", "lightcoral")
    .attr("opacity", 0.7);

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

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

// Load data initially
loadData();
