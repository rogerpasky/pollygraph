const data = {
    nodes: [
        {id: "Myriel", group: 1},
        {id: "Napoleon", group: 1},
        {id: "Mlle.Baptistine", group: 1},
        {id: "Mme.Magloire", group: 1},
        {id: "CountessdeLo", group: 1},
        {id: "Geborand", group: 1},
        {id: "Champtercier", group: 1},
        {id: "Cravatte", group: 1},
        {id: "Count", group: 1},
        {id: "OldMan", group: 1},
        {id: "Labarre", group: 2},
        {id: "Valjean", group: 2},
        {id: "Marguerite", group: 3},
        {id: "Mme.deR", group: 2},
        {id: "Isabeau", group: 2},
        {id: "Gervais", group: 2},
        {id: "Tholomyes", group: 3},
        {id: "Listolier", group: 3},
        {id: "Fameuil", group: 3},
        {id: "Blacheville", group: 3},
        {id: "Favourite", group: 3},
        {id: "Dahlia", group: 3}
    ],
    links: [
        {source: "Napoleon", target: "Myriel", value: 1},
        {source: "Mlle.Baptistine", target: "Myriel", value: 8},
        {source: "Mme.Magloire", target: "Myriel", value: 10},
        {source: "Mme.Magloire", target: "Mlle.Baptistine", value: 6},
        {source: "CountessdeLo", target: "Myriel", value: 1},
        {source: "Geborand", target: "Myriel", value: 1},
        {source: "Champtercier", target: "Myriel", value: 1},
        {source: "Cravatte", target: "Myriel", value: 1},
        {source: "Count", target: "Myriel", value: 2},
        {source: "OldMan", target: "Myriel", value: 1},
        {source: "Valjean", target: "Labarre", value: 1},
        {source: "Valjean", target: "Mme.Magloire", value: 3},
        {source: "Valjean", target: "Mlle.Baptistine", value: 3},
        {source: "Valjean", target: "Myriel", value: 5},
        {source: "Marguerite", target: "Valjean", value: 1},
        {source: "Mme.deR", target: "Valjean", value: 1},
        {source: "Isabeau", target: "Valjean", value: 1},
        {source: "Gervais", target: "Valjean", value: 1},
        {source: "Listolier", target: "Tholomyes", value: 4},
        {source: "Fameuil", target: "Tholomyes", value: 4},
        {source: "Fameuil", target: "Listolier", value: 4},
        {source: "Blacheville", target: "Tholomyes", value: 4},
        {source: "Blacheville", target: "Listolier", value: 4},
        {source: "Blacheville", target: "Fameuil", value: 4},
        {source: "Favourite", target: "Tholomyes", value: 3},
        {source: "Favourite", target: "Listolier", value: 3},
        {source: "Favourite", target: "Fameuil", value: 3},
        {source: "Favourite", target: "Blacheville", value: 4},
        {source: "Dahlia", target: "Tholomyes", value: 3},
        {source: "Dahlia", target: "Listolier", value: 3},
        {source: "Dahlia", target: "Fameuil", value: 3},
        {source: "Dahlia", target: "Blacheville", value: 3},
        {source: "Dahlia", target: "Favourite", value: 5}
    ]
};

// Specify the dimensions of the chart.
const width = 928;
const height = 600;

// Specify the color scale.
const color = d3.scaleOrdinal(d3.schemeCategory10);

// The force simulation mutates links and nodes, so create a copy
// so that re-evaluating this cell produces the same result.
const links = data.links.map(d => ({...d}));
const nodes = data.nodes.map(d => ({...d}));

// Create a simulation with several forces.
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);

// Set the position attributes of links and nodes each time the simulation ticks.
function ticked() {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
}

const svg = d3.select('#the-chart')
    .attr('width', width)
    .attr('height', height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

// Add a line for each link, and a circle for each node.
const link = svg.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll()
    .data(links)
    .join("line")
        .attr('tabindex', 0)
        .attr('class', 'arc')
        .attr("stroke-width", d => Math.sqrt(d.value))
        .on('focus', function() {
            // Apply visual changes to indicate focus, e.g., change stroke color
            d3.select(this).attr('stroke', 'blue');
        })
        .on('blur', function() {
            // Revert visual changes when the element loses focus
            d3.select(this).attr('stroke', '#999');
        });

const node = svg.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll()
    .data(nodes)
    .join("circle")
        .attr('id', d => d.id)
        .attr('tabindex', 0)
        .attr('class', 'arc')
        .attr("r", 5)
        .attr("fill", d => color(d.group))
        .on('focus', onFocusNode)
        .on('blur', function() {
            // Revert visual changes when the element loses focus
            d3.select(this).attr('stroke', '#fff');
        });

node.append("title")
    .text(d => d.id);

link.append("title")
    .text(d => `De ${d.source.id} a ${d.target.id}`);

d3.select("body").on("keydown", function(event) {
    // Check if the "Enter" key was pressed
    if (event.key === "ArrowRight") {
        console.log("Right arrow key was pressed");
    }
    else if (event.key === "ArrowLeft") {
        console.log("Left arrow key was pressed");
    }
    else if (event.key === "ArrowUp") {
        console.log("Up arrow key was pressed");
    }
    else if (event.key === "ArrowDown") {
        console.log("Down arrow key was pressed");
    }
});

function onFocusNode() {
    d3.select(this)
        .attr('stroke', 'blue');
    console.log(this.id)
    // Highlight the links connected to the focused node.
    link
        .attr('stroke', d => {
            return d.source.id === this.id || d.target.id === this.id ? 'blue' : '#999';
        });
}

// Create the SVG container.
// const svg = d3.create("svg")
//     .attr("width", width)
//     .attr("height", height)
//     .attr("viewBox", [0, 0, width, height])
//     .attr("style", "max-width: 100%; height: auto;");

// // Add a drag behavior.
// node.call(d3.drag()
//         .on("start", dragstarted)
//         .on("drag", dragged)
//         .on("end", dragended));

// // Reheat the simulation when drag starts, and fix the subject position.
// function dragstarted(event) {
//     if (!event.active) simulation.alphaTarget(0.3).restart();
//     event.subject.fx = event.subject.x;
//     event.subject.fy = event.subject.y;
// }

// // Update the subject (dragged node) position during drag.
// function dragged(event) {
//     event.subject.fx = event.x;
//     event.subject.fy = event.y;
// }

// // Restore the target alpha so the simulation cools after dragging ends.
// // Unfix the subject position now that it’s no longer being dragged.
// function dragended(event) {
//     if (!event.active) simulation.alphaTarget(0);
//     event.subject.fx = null;
//     event.subject.fy = null;
// }
