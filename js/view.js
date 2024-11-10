// Specify the dimensions of the chart.
const width = 928;
const height = 600;

// Specify the color scale.
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Specify visual constants
const NODE_BORDER_WIDTH = 1.5;
const NODE_RADIUS = 5;

const NODE_COLOR_FOCUSED = '#f00';  // TODO: move to CSS classes
const NODE_OPACITY_FOCUSED = 1.0;

const NODE_COLOR_PREFOCUSED = '#999';
const NODE_OPACITY_PREFOCUSED = 1.0;

const NODE_COLOR_UNFOCUSED = '#fff';
const NODE_OPACITY_UNFOCUSED = 1.0;

const LINK_COLOR_FOCUSED = '#f00';
const LINK_OPACITY_FOCUSED = 1.0;

const LINK_COLOR_PREFOCUSED = '#999';
const LINK_OPACITY_PREFOCUSED = 0.9;

const LINK_COLOR_UNFOCUSED = '#999';
const LINK_OPACITY_UNFOCUSED = 0.2;


export class View {
    constructor(
        linkTextFormatter = null,
        directedLinkTextFormatter = null,
    ) {
        this.controller = null;
        this.linksGroup = null;
        this.nodesGroup = null;
        this.simulation = null;
        this.svg = this.getDomSvg();
        this.shiftPressed = false;
        this.setKeyCallbacks();
        this.linkTextFormatter = linkTextFormatter || defaultLinkTextFormatter;
        this.directedLinkTextFormatter = directedLinkTextFormatter || defaultDirectedLinkTextFormatter;
        this.restart()
    }

    // Setup methods -----------------------------------------------------------

    restart() {
        if (this.simulation) {
            this.simulation.stop();
        }
        if (this.linksGroup) {
            this.svg.select("#links").remove();
        }
        if (this.nodesGroup) {
            this.svg.select("#nodes").remove();
        }
    }

    setKeyCallbacks() {
        d3.select("body")
            .on("keydown", (event) => this.onKeydown(event.key))
            .on("keyup", (event) => this.onKeyup(event.key));
    }

    setController(controller) {
        this.controller = controller;
    }

    getWidth(element) {
        const computedStyle = window.getComputedStyle(element);
        return parseInt(computedStyle.width);
    }

    getHeight(element) {
        const computedStyle = window.getComputedStyle(element);
        return parseInt(computedStyle.height);
    }

    getDomSvg() {
        return d3.select('#the-graph');
    }

    createNodes(nodesData) {
        var classThis = this;
        this.nodesGroup = this.svg
            .append("g")
            .attr('id', 'nodes')
            .selectAll()
            .data(nodesData)
            .join("circle")
                .attr('id', d => d.id)
                .attr('role', 'treeitem')
                .attr('class', 'arc')
                .attr('tabindex', 0)  // needed for Safari and Firefox
                .attr("stroke", NODE_COLOR_UNFOCUSED)
                .attr("stroke-width", NODE_BORDER_WIDTH)
                .attr('r', NODE_RADIUS)
                .attr('fill', d => color(d.group))  // TODO: decide right place/format in data
                // .on("click", (event) => console.log(`Click on ${event.target}`))
                .on('focus', (event) => classThis.onFocusNode(event.target))
                .on('blur', (event) => classThis.onBlurNode(event.target));

        this.nodesGroup
            .append("title")
                .text(d => d.label ? d.label : d.id);
    }

    createLinks(linksData) {
        var classThis = this;
        this.linksGroup = this.svg
            .append("g")
            .attr('id', 'links')
            .selectAll()
            .data(linksData)
            .join("line")
                .attr('id', d => d.id)
                .attr('role', 'treeitem')
                .attr('class', 'arc')
                .attr('tabindex', 0)  // needed for Safari and Firefox
                .attr("stroke", LINK_COLOR_UNFOCUSED)
                .attr("stroke-opacity", LINK_OPACITY_UNFOCUSED)
                .attr("stroke-width", d => Math.sqrt(d.value))
                .on('focus', (event) => classThis.onFocusLink(event.target))
                .on('blur', (event) => classThis.onBlurLink(event.target));
        this.linksGroup
            .append("title")
                .text(d => this.formatLinkLabelbetweenTwoNodeId(d.source.id, d.target.id));
    }

    createSimulation(linksData, nodesData) {
        const width = this.getWidth(this.svg.node());
        const height = this.getHeight(this.svg.node());

        var classThis = this;
        this.simulation = d3.forceSimulation(nodesData)
            .force("link", d3.forceLink(linksData).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-5))
            // .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(NODE_RADIUS + 1))
            .on("tick", () => classThis.onTicked());
    }

    // Event handlers ----------------------------------------------------------

    onFocusNode(node) {
        const nodeId = node.getAttribute('id');
        this.controller.focusNode(nodeId);
    }

    onBlurNode(node) {
        const nodeId = node.getAttribute('id');
        this.controller.unFocusNode(nodeId);
    }

    onFocusLink(link) {
        const linkId = link.getAttribute('id');
        this.controller.focusLink(linkId);
    }

    onBlurLink(link) {
        const linkId = link.getAttribute('id');
        this.controller.unFocusLink(linkId)
    }

    onKeydown(key) {
        if (!this.controller) {
            return;
        }
        else if (key === "ArrowRight") {
            this.controller.focusForward();
        }
        else if (key === "ArrowLeft") {
            this.controller.focusBackward();
        }
        else if (key === "ArrowUp") {
            this.controller.focusPrevious(this.shiftPressed);
        }
        else if (key === "ArrowDown") {
            this.controller.focusNext(this.shiftPressed);
        }
        else if (key === "Enter" || key === " ") {
            this.controller.focusDetails();
        }
        else if (key === "Shift") {
            this.shiftPressed = true;
        }
        else {
            console.log(`Unhandled Key pressed: ${key}`);
        }
    }

    onKeyup(key) {
        if (key === "Shift") {
            this.shiftPressed = false;
        }
    }

    onDataChange(linksData, nodesData) {
        this.restart();
        this.createLinks(linksData);
        this.createNodes(nodesData);
        this.createSimulation(linksData, nodesData);

        this.currentFocusedNode = this.nodesGroup.nodes()[0];
        this.currentFocusedLink = this.selectConnectedLinks(this.currentFocusedNode).nodes()[0];    
    }

    onTicked() {
        this.linksGroup
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        this.nodesGroup
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        const minX = d3.min(this.nodesGroup.data(), d => d.x);
        const maxX = d3.max(this.nodesGroup.data(), d => d.x);
        const minY = d3.min(this.nodesGroup.data(), d => d.y);
        const maxY = d3.max(this.nodesGroup.data(), d => d.y);
        const width = maxX - minX;
        const height = maxY - minY;

        this.svg.attr("viewBox", [
            minX - NODE_RADIUS, 
            minY - NODE_RADIUS, 
            width + 2 * NODE_RADIUS, 
            height + 2 * NODE_RADIUS
        ]);
    }

    // Visualization methods ---------------------------------------------------

    displayFocusOnNodeId(nodeId) {
        const node = document.getElementById(nodeId);
        this._displayFocusOnNode(node);
    }

    _displayFocusOnNode(node) {
        node.setAttribute('stroke', NODE_COLOR_FOCUSED);
        node.setAttribute('stroke-opacity', NODE_OPACITY_FOCUSED);
    }

    displayPreFocusOnNodeId(nodeId) {
        const node = document.getElementById(nodeId);
        this._displayPreFocusOnNode(node);
    }

    _displayPreFocusOnNode(node) {
        node.setAttribute('stroke', NODE_COLOR_PREFOCUSED);
        node.setAttribute('stroke-opacity', NODE_OPACITY_PREFOCUSED);
    }

    displayUnFocusOnNodeId(nodeId) {
        const node = document.getElementById(nodeId);
        this._displayUnFocusOnNode(node);
    }

    _displayUnFocusOnNode(node) {
        node.setAttribute('stroke', NODE_COLOR_UNFOCUSED);
        node.setAttribute('stroke-opacity', NODE_OPACITY_UNFOCUSED);
    }

    displayFocusOnLinkId(linkId) {
        const link = document.getElementById(linkId);
        this._displayFocusOnLink(link);
    }

    _displayFocusOnLink(link) {
        link.setAttribute('stroke', LINK_COLOR_FOCUSED);
        link.setAttribute('stroke-opacity', LINK_OPACITY_FOCUSED);
    }

    displayPreFocusOnLinkId(linkId) {
        const link = document.getElementById(linkId);
        this._displayPreFocusOnLink(link);
    }

    _displayPreFocusOnLink(link) {
        link.setAttribute('stroke', LINK_COLOR_PREFOCUSED);
        link.setAttribute('stroke-opacity', LINK_OPACITY_PREFOCUSED);
    }

    displayUnFocusOnLinkId(linkId) {
        const link = document.getElementById(linkId);
        this._displayUnFocusOnLink(link);
    }

    _displayUnFocusOnLink(link) {
        link.setAttribute('stroke', LINK_COLOR_UNFOCUSED);
        link.setAttribute('stroke-opacity', LINK_OPACITY_UNFOCUSED);
    }

    displayPreFocusOnConnectedLinksToNodeId(nodeId) {  // TODO: optimize
        const connectedLinks = this.selectConnectedLinks(nodeId);
        this.linksGroup
            .selectAll("title")
                .text(d => this.formatLinkLabelbetweenTwoNodeId(d.source.id, d.target.id));
        connectedLinks
            .select("title")
                .text(d => this.formatLinkLabelStartingFromNodeId(d, nodeId))
        this.linksGroup
            .selectAll(function() {
                this.setAttribute('stroke', LINK_COLOR_UNFOCUSED);
                if (connectedLinks.nodes().includes(this)) {
                    this.setAttribute('stroke-opacity', LINK_OPACITY_PREFOCUSED);
                }
                else {
                    this.setAttribute('stroke-opacity', LINK_OPACITY_UNFOCUSED);
                }
            });
    }

    // Selection methods -------------------------------------------------------

    selectConnectedLinks(nodeId) {
        return this.linksGroup.filter(d => d.source.id === nodeId || d.target.id === nodeId);
    }

    // Formatting methods ------------------------------------------------------

    formatLinkLabelStartingFromNodeId(linkData, fromNodeId) {
        if (linkData.source.id === fromNodeId) {
            var toNodeId = linkData.target.id;
        }
        else {
            var toNodeId = linkData.source.id;
        }
        const fromText = document.getElementById(fromNodeId).getElementsByTagName('title')[0].textContent;
        const toText = document.getElementById(toNodeId).getElementsByTagName('title')[0].textContent;
        return this.directedLinkTextFormatter(fromText, toText);
    
    }

    formatLinkLabelbetweenTwoNodeId(sourceId, targetId) {
        const sourceElement = document.getElementById(sourceId)
        const sourceText = sourceElement ? sourceElement.getElementsByTagName('title')[0].textContent : sourceId;
        const targetElement = document.getElementById(targetId)
        const targetText = targetElement ? targetElement.getElementsByTagName('title')[0].textContent : targetId;
        return this.linkTextFormatter(sourceText, targetText);
    }

    // Find and Focus methods --------------------------------------------------

    findAndFocusElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            console.log(`Focus on element with id ${elementId}`);
            element.focus();
        }
        else {
            console.error(`Element with id ${elementId} not found`);
        }
    }
}

// Default formatters ---------------------------------------------------------

function defaultLinkTextFormatter(sourceText, targetText) {
    return `${sourceText} - ${targetText}`;
}

function defaultDirectedLinkTextFormatter(fromText, toText) {
    return `from ${fromText} to ${toText}`;
}
