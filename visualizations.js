// JavaScript for Car Dataset Visualization

// Load the data
async function loadData() {
    const data = await d3.csv("https://raw.githubusercontent.com/hemanthpranav/IV-MAIN/main/a1-cars.csv").then(data => { ... });
    data.forEach(d => {
        d.MPG = +d.MPG;
        d.Displacement = +d.Displacement;
        d.Weight = +d.Weight;
        d.Model_Year = +d.Model_Year;
    });
    createBarChart(data);
    createScatterPlot(data);
    createLineChart(data);
}

// Bar Chart: MPG by Origin and Manufacturer
function createBarChart(data) {
    // Group data by Origin and Manufacturer
    const aggregatedData = d3.rollups(
        data,
        v => d3.mean(v, d => d.MPG),
        d => d.Origin,
        d => d.Manufacturer
    );

    const margin = { top: 20, right: 20, bottom: 100, left: 50 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x0 = d3.scaleBand()
        .domain(aggregatedData.map(d => d[0]))
        .range([0, width])
        .padding(0.1);

    const x1 = d3.scaleBand()
        .domain(data.map(d => d.Manufacturer))
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(aggregatedData, d => d3.max(d[1], v => v[1]))])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    svg.append("g")
        .selectAll("g")
        .data(aggregatedData)
        .enter().append("g")
        .attr("transform", d => `translate(${x0(d[0])}, 0)`)
        .selectAll("rect")
        .data(d => d[1])
        .enter().append("rect")
        .attr("x", d => x1(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d[1]))
        .attr("fill", d => color(d[0]));
}

// Scatter Plot: Displacement vs MPG
function createScatterPlot(data) {
    const margin = { top: 20, right: 20, bottom: 50, left: 50 },
        width = 400 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#scatter-displacement")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Displacement))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.MPG))
        .range([height, 0]);

    svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => x(d.Displacement))
        .attr("cy", d => y(d.MPG))
        .attr("r", 3)
        .attr("fill", "steelblue");
}

// Line Chart: Weight Evolution Over Model Years
function createLineChart(data) {
    const margin = { top: 20, right: 20, bottom: 50, left: 50 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#line-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const groupedData = d3.groups(data, d => d.Model_Year);

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Model_Year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Weight))
        .range([height, 0]);

    const line = d3.line()
        .x(d => x(d[0]))
        .y(d => y(d3.mean(d[1], v => v.Weight)));

    svg.append("path")
        .datum(groupedData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);
}

// Load data and create visualizations
loadData();
