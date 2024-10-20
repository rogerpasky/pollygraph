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

// Specify visual constants
const NODE_COLOR_UNFOCUSED = '#fff';
const NODE_COLOR_FOCUSED = '#f00';
const NODE_BORDER_WIDTH = 1.5;
const NODE_RADIUS = 5;
const LINK_COLOR_UNFOCUSED = '#999';
const LINK_COLOR_FOCUSED = '#f00';
const LINK_OPACITY_UNFOCUSED = 0.2;
const LINK_OPACITY_PREFOCUSED = 0.9;
const LINK_OPACITY_FOCUSED = 1.0;

// Hierarchy states
const HIERARCHY_STATES = ['node', 'link'];

// The force simulation mutates links and nodes, so create a copy
// so that re-evaluating this cell produces the same result.
const linksData = data.links.map(d => ({...d}));
const nodesData = data.nodes.map(d => ({...d}));

// Create a simulation with several forces.
const simulation = d3.forceSimulation(nodesData)
    .force("link", d3.forceLink(linksData).id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);

// Set the position attributes of links and nodes each time the simulation ticks.
function ticked() {
    linkGroup
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    nodeGroup
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
}

const svg = d3.select('#the-chart')
    .attr('width', width)
    .attr('height', height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

// Add a line for each link.
const linkGroup = svg.append("g")
    .attr("stroke", LINK_COLOR_UNFOCUSED)
    .attr("stroke-opacity", LINK_OPACITY_UNFOCUSED)
    .selectAll()
    .data(linksData)
    .join("line")
        .attr('id', d => getLinkId(d))
        .attr('aria-describedby', (d,i) => `Debería decir tooltip-${i}`)  // This is not working, but title does
        .attr('class', 'arc')
        .attr("stroke-width", d => Math.sqrt(d.value))
        .on('focus', onFocusLink)
        .on('blur', onBlurLink);

// Add a circle for each node.
const nodeGroup = svg.append("g")
    .attr("stroke", NODE_COLOR_UNFOCUSED)
    .attr("stroke-width", NODE_BORDER_WIDTH)
    .selectAll()
    .data(nodesData)
    .join("circle")
        .attr('id', d => d.id)
        .attr('class', 'arc')
        .attr('r', NODE_RADIUS)
        .attr('fill', d => color(d.group))
        .on('focus', onFocusNode)
        .on('blur', onBlurNode);

nodeGroup.append("title")
    .text(d => d.id);

linkGroup.append("title")
    .text(d => `From ${d.source.id} to ${d.target.id}`);

d3.select("body").on("keydown", onKeydown);

function onFocusNode() {
    displayUnfocusOnNode(currentFocusedNode);
    currentFocusedNode = this;
    // focus on one of the connected links if not already focused
    const connectedLinks = selectConnectedLinks(currentFocusedNode).nodes();
    if (connectedLinks.includes(currentFocusedLink)) {
        currentFocusedLink.focus();
    }
    else {
        connectedLinks[0].focus();  // TODO: focus on the closest link
    }
    displayFocusOnNode(currentFocusedNode);
}

function onFocusLink() {
    currentFocusedLink = this;
    // display focus on one of the connected nodes if not already displayed
    const linkedNodes = selectLinkedNodes(currentFocusedLink).nodes();
    if (linkedNodes.includes(currentFocusedNode)) {
        displayFocusOnNode(currentFocusedNode);  // maybe sometimes redundant
    }
    else {
        displayUnfocusOnNode(currentFocusedNode);
        currentFocusedNode = linkedNodes[0];  // any of the linked nodes
        displayFocusOnNode(currentFocusedNode);
    }
    const connectedLinksSelection = selectConnectedLinks(currentFocusedNode);
    preFocusConnectedLinks(connectedLinksSelection);
    displayFocusOnLink(currentFocusedLink);
}

function onBlurLink() {
    displayUnfocusOnLink(this);
}

function onBlurNode() {
    displayUnfocusOnNode(this);
}

function onKeydown(event) {
    console.log(`Key pressed: ${event.key}`);
    if (event.key === "ArrowRight") {  // Dig-in in hierarchy
        console.log("Right arrow key was pressed");
    }
    else if (event.key === "ArrowLeft") {
        console.log("Left arrow key was pressed");
    }
    else if (event.key === "ArrowUp") {
        DisplayFocusOnPreviousLink();
    }
    else if (event.key === "ArrowDown") {
        console.log("Down arrow key was pressed");
        DisplayFocusOnNextLink();
    }
    else if (event.key === "Enter" || event.key === " ") {
        exchangeNodeFocusOnLink();
    }
}

function getLinkId(linkData) {
    // TODO: check redundancies
    if (linkData.source.id < linkData.target.id) {
        return `${linkData.source.id} - ${linkData.target.id}`;
    }
    else {
        return `${linkData.target.id} - ${linkData.source.id}`;
    }
}

function selectConnectedLinks(node) {
    return linkGroup.filter(d => d.source.id === currentFocusedNode.getAttribute('id') || d.target.id === node.getAttribute('id'));
}

function selectLinkedNodes(link) {
    const linkData = linksData.find(linkData => getLinkId(linkData) === link.getAttribute('id'));
    return nodeGroup.filter(d => d.id === linkData.source.id || d.id === linkData.target.id);
}

function getOtherSideOfLink(link, node) {
    const linkData = linksData.find(linkData => getLinkId(linkData) === link.getAttribute('id'));
    if (linkData.source.id !== node.getAttribute('id') && linkData.target.id !== node.getAttribute('id')) {
        return null;
    }
    const other = linkData.source.id === node.getAttribute('id') ? linkData.target.id : linkData.source.id;
    return nodeGroup.filter(d => d.id === other).nodes()[0];
}

function exchangeNodeFocusOnLink() {
    displayUnfocusOnNode(currentFocusedNode);
    const otherNode = getOtherSideOfLink(currentFocusedLink, currentFocusedNode);
    currentFocusedNode = otherNode;
    displayFocusOnNode(currentFocusedNode);

    const connectedLinksSelection = selectConnectedLinks(currentFocusedNode);
    preFocusConnectedLinks(connectedLinksSelection);
    displayFocusOnLink(currentFocusedLink);
}

function DisplayFocusOnPreviousLink() {
    const connectedLinks = selectConnectedLinks(currentFocusedNode);
    var nextLinkIndex = connectedLinks.nodes().findIndex((d, i, nodes) => 
        nodes[i] === currentFocusedLink
    ) - 1;
    if (nextLinkIndex === -1) {
        nextLinkIndex = connectedLinks.nodes().length -1;
    }
    currentFocusedLink = connectedLinks.nodes()[nextLinkIndex];
    preFocusConnectedLinks(connectedLinks);
    const previousLink = connectedLinks.select((d, i, nodes) => 
        nodes[i] === currentFocusedLink ? nodes[i] : null
    ).nodes()[0];
    previousLink.focus();
}

function DisplayFocusOnNextLink() {
    const connectedLinks = selectConnectedLinks(currentFocusedNode);
    var nextLinkIndex = connectedLinks.nodes().findIndex((d, i, nodes) => 
        nodes[i] === currentFocusedLink
    ) + 1;
    if (nextLinkIndex === connectedLinks.nodes().length) {
        nextLinkIndex = 0;
    }
    currentFocusedLink = connectedLinks.nodes()[nextLinkIndex];
    preFocusConnectedLinks(connectedLinks);
    const nextLink = connectedLinks.select((d, i, nodes) => 
        nodes[i] === currentFocusedLink ? nodes[i] : null
    ).nodes()[0];
    nextLink.focus();
}

function preFocusConnectedLinks(connectedLinks) {
    linkGroup
        .selectAll(function() {
            this.setAttribute('stroke', LINK_COLOR_UNFOCUSED);
            if (connectedLinks.nodes().includes(this)) {
                this.setAttribute('stroke-opacity', LINK_OPACITY_PREFOCUSED);
                this.setAttribute('tabindex', 0);
            }
            else {
                this.setAttribute('stroke-opacity', LINK_OPACITY_UNFOCUSED);
                this.setAttribute('tabindex', -1);
            }
        });
}

function displayFocusOnLink(link) {
    link.setAttribute('stroke', LINK_COLOR_FOCUSED)
    link.setAttribute('stroke-opacity', LINK_OPACITY_FOCUSED);
}

function displayUnfocusOnLink(link) {
    link.setAttribute('stroke', LINK_COLOR_UNFOCUSED);
}

function displayFocusOnNode(node) {
    node.setAttribute('stroke', NODE_COLOR_FOCUSED);
}

function displayUnfocusOnNode(node) {
    node.setAttribute('stroke', NODE_COLOR_UNFOCUSED);
}

// Initial global status
var currentFocusedNode = nodeGroup.nodes()[0];
var currentFocusedLink = selectConnectedLinks(currentFocusedNode).nodes()[0];

currentFocusedLink.focus();


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
