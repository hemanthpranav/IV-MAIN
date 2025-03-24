// JavaScript for Car Dataset Visualization 

// Load the data
async function loadData() {
  try {
    // Use raw GitHub URL or correct local path
    const data = await d3.csv("https://raw.githubusercontent.com/hemanthpranav/IV-MAIN/main/a1-cars.csv").then(data => { ... });
    
    // Data preprocessing
    data.forEach(d => {
      d.MPG = d.MPG === "NA" ? null : +d.MPG;
      d.Displacement = d.Displacement === "NA" ? null : +d.Displacement;
      d.Weight = d.Weight === "NA" ? null : +d.Weight;
      d.Model_Year = d.Model_Year === "NA" ? null : +d.Model_Year;
    });

    // Filter out null values
    const filteredData = data.filter(d => d.MPG !== null && d.Displacement !== null && d.Weight !== null && d.Model_Year !== null);
    
    createBarChart(filteredData);
    createScatterPlot(filteredData);
    createLineChart(filteredData);
    
  } catch (error) {
    console.error("Error loading or processing data:", error);
  }
}

// Bar Chart: MPG by Origin and Manufacturer
function createBarChart(data) {
  // Clear previous chart if exists
  d3.select("#bar-chart").html("");
  
  // Set up dimensions
  const margin = { top: 40, right: 30, bottom: 80, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select("#bar-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Group data by Origin and Manufacturer
  const groupedData = d3.rollups(
    data,
    v => d3.mean(v, d => d.MPG),
    d => d.Origin,
    d => d.Manufacturer
  );

  // Set up scales
  const x0 = d3.scaleBand()
    .domain(groupedData.map(d => d[0]))
    .range([0, width])
    .padding(0.2);

  const manufacturers = [...new Set(data.map(d => d.Manufacturer))];
  const x1 = d3.scaleBand()
    .domain(manufacturers)
    .range([0, x0.bandwidth()])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(groupedData, d => d3.max(d[1], v => v[1]))])
    .nice()
    .range([height, 0]);

  // Add bars
  svg.append("g")
    .selectAll("g")
    .data(groupedData)
    .enter().append("g")
    .attr("transform", d => `translate(${x0(d[0])},0)`)
    .selectAll("rect")
    .data(d => d[1])
    .enter().append("rect")
    .attr("x", d => x1(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x1.bandwidth())
    .attr("height", d => height - y(d[1]))
    .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Add labels
  svg.append("text")
    .attr("x", width/2)
    .attr("y", height + margin.bottom - 10)
    .style("text-anchor", "middle")
    .text("Origin");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height/2)
    .style("text-anchor", "middle")
    .text("Average MPG");
}

// Scatter Plot: Displacement vs MPG
function createScatterPlot(data) {
  // Clear previous chart if exists
  d3.select("#scatter-displacement").html("");
  
  const margin = { top: 40, right: 30, bottom: 60, left: 60 };
  const width = 600 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#scatter-displacement")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Displacement))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.MPG))
    .range([height, 0]);

  // Add dots
  svg.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => x(d.Displacement))
    .attr("cy", d => y(d.MPG))
    .attr("r", 5)
    .attr("fill", "steelblue")
    .attr("opacity", 0.7);

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Add labels
  svg.append("text")
    .attr("x", width/2)
    .attr("y", height + margin.bottom - 10)
    .style("text-anchor", "middle")
    .text("Displacement");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height/2)
    .style("text-anchor", "middle")
    .text("MPG");
}

// Line Chart: Weight Evolution Over Model Years
function createLineChart(data) {
  // Clear previous chart if exists
  d3.select("#line-chart").html("");
  
  const margin = { top: 40, right: 30, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#line-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Group data by year and calculate average weight
  const groupedData = d3.rollup(
    data,
    v => d3.mean(v, d => d.Weight),
    d => d.Model_Year
  );
  
  const sortedData = Array.from(groupedData).sort((a, b) => a[0] - b[0]);

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Model_Year))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Weight))
    .range([height, 0]);

  // Line generator
  const line = d3.line()
    .x(d => x(d[0]))
    .y(d => y(d[1]));

  // Add line
  svg.append("path")
    .datum(sortedData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Add labels
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

// Initialize the visualization
document.addEventListener('DOMContentLoaded', function() {
  loadData();
});


