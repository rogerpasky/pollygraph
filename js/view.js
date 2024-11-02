// Specify the dimensions of the chart.
const width = 928;
const height = 600;

// Specify the color scale.
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Specify visual constants
const NODE_COLOR_UNFOCUSED = '#fff';
const NODE_COLOR_FOCUSED = '#f00';
const NODE_COLOR_PREFOCUSED = '#999';
const NODE_BORDER_WIDTH = 1.5;
const NODE_RADIUS = 5;
const LINK_COLOR_UNFOCUSED = '#999';
const LINK_COLOR_FOCUSED = '#f00';
const LINK_OPACITY_UNFOCUSED = 0.2;
const LINK_OPACITY_PREFOCUSED = 0.9;
const LINK_OPACITY_FOCUSED = 1.0;


export class View {
    constructor() {
        this.shiftPressed = false;

        d3.select("body")
            .on("keydown", (event) => this.onKeydown(event.key))
            .on("keyup", (event) => this.onKeyup(event.key));
    }

    // Setup methods -----------------------------------------------------------

    setController(controller) {
        this.controller = controller;
    }

    createSimulation(linksData, nodesData) {
        var classThis = this;
        // Create a simulation with several forces.
        this.simulation = d3.forceSimulation(nodesData)
            .force("link", d3.forceLink(linksData).id(d => d.id))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2))  // FIXME: get it from SVG
            .on("tick", () => classThis.onTicked());
    }

    createSvg() {
        this.svg = d3.select('#the-chart')
            .attr('width', width)  // FIXME: get it from SVG
            .attr('height', height)  // FIXME: get it from SVG
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");
    }

    createLinks(linksData) {
        var classThis = this;
        this.linksGroup = this.svg
            .append("g")
            .selectAll()
            .data(linksData)
            .join("line")
                .attr('id', d => d.id)
                .attr('role', 'treeitem')
                .attr('class', 'arc')
                .attr("stroke", LINK_COLOR_UNFOCUSED)
                .attr("stroke-opacity", LINK_OPACITY_UNFOCUSED)
                .attr("stroke-width", d => Math.sqrt(d.value))
                .on('focus', (event) => classThis.onFocusLink(event.target))
                .on('blur', (event) => classThis.onBlurLink(event.target));
        this.linksGroup
            .append("title")
                .text(d => formatLinkText(d.source, d.target));
    }

    createNodes(nodesData) {
        var classThis = this;
        this.nodesGroup = this.svg
            .append("g")
            .selectAll()
            .data(nodesData)
            .join("circle")
                .attr('id', d => d.id)
                .attr('role', 'treeitem')
                .attr('class', 'arc')
                .attr("stroke", NODE_COLOR_UNFOCUSED)
                .attr("stroke-width", NODE_BORDER_WIDTH)
                .attr('r', NODE_RADIUS)
                .attr('fill', d => color(d.group))  // TODO: decide right place/format in data
                .on('focus', (event) => classThis.onFocusNode(event.target))
                .on('blur', (event) => classThis.onBlurNode(event.target));

        this.nodesGroup
            .append("title")
                .text(d => d.id);
    }

    // Event handlers ----------------------------------------------------------

    onFocusNode(node) {
        const nodeId = node.getAttribute('id');
        this.displayFocusOnNodeId(nodeId);
        this.controller.focusNode(nodeId);
    }

    onBlurNode(node) {
        const nodeId = node.getAttribute('id');
        if (this.controller.preFocusedNodeId === nodeId) {
            this.displayPreFocusOnNodeId(nodeId);
        }
        else {
            this.displayUnfocusOnNodeId(node);
        }
    }

    onFocusLink(link) {
        const linkId = link.getAttribute('id');
        if (this.controller.focusedLinkId) {
            this.displayPreFocusOnNodeId(this.controller.preFocusedNodeId);
        }
        this._displayFocusOnLink(link);
        this.controller.focusLink(linkId);
    }

    onBlurLink(link) {
        this._displayUnfocusOnLink(link);
    }

    onKeydown(key) {
        console.log(`Key pressed: ${key}`);
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
        else if (key === "Enter" || event.key === " ") {
            this.controller.focusDetails();
        }
        else if (key === "Shift") {
            this.shiftPressed = true;
        }
        else {
            console.log(`Key pressed: ${key}`);
        }
    }

    onKeyup(key) {
        if (key === "Shift") {
            this.shiftPressed = false;
        }
    }

    onDataChange(linksData, nodesData) {
        this.createSvg();
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
    }

    // Visualization methods ---------------------------------------------------

    displayFocusOnNodeId(nodeId) {
        this.displayPreFocusOnConnectedLinksToNodeId(nodeId);
        const node = document.getElementById(nodeId);
        this._displayFocusOnNode(node);
    }

    _displayFocusOnNode(node) {
        node.setAttribute('stroke', NODE_COLOR_FOCUSED);
    }

    displayUnfocusOnNodeId(nodeId) {
        const node = document.getElementById(nodeId);
        this._displayUnfocusOnNode(node);
    }

    _displayUnfocusOnNode(node) {
        node.setAttribute('stroke', NODE_COLOR_UNFOCUSED);
    }

    displayFocusOnLinkId(linkId) {
        const link = document.getElementById(linkId);
        this._displayFocusOnLink(link);
    }

    _displayFocusOnLink(link) {
        link.setAttribute('stroke', LINK_COLOR_FOCUSED);
        link.setAttribute('stroke-opacity', LINK_OPACITY_FOCUSED);
    }

    displayUnfocusOnLinkId(linkId) {
        const link = document.getElementById(linkId);
        this._displayUnfocusOnLink(link);
    }

    _displayUnfocusOnLink(link) {
        link.setAttribute('stroke', LINK_COLOR_UNFOCUSED);
    }

    displayPreFocusOnNodeId(nodeId) {
        const node = document.getElementById(nodeId);
        if (node) {
            this._displayPreFocusOnNode(node);
        }
        else {
            console.error(`Node with id ${nodeId} not found`);
        }
    }

    _displayPreFocusOnNode(node) {
        node.setAttribute('stroke-opacity', LINK_OPACITY_PREFOCUSED);
        node.setAttribute('stroke', NODE_COLOR_PREFOCUSED);
    }

    displayPreFocusOnConnectedLinksToNodeId(nodeId) {
        const connectedLinks = this.selectConnectedLinks(nodeId);
        this.linksGroup
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

    // Selection methods -------------------------------------------------------

    selectConnectedLinks(nodeId) {
        return this.linksGroup.filter(d => d.source.id === nodeId || d.target.id === nodeId);
    }

    selectLink(linkId) {
        return this.linksGroup.filter(d => d.id === linkId);
    }

    // Find and Focus methods --------------------------------------------------

    findAndFocusElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.focus();
        }
        else {
            console.error(`Element with id ${elementId} not found`);
        }
    }
}

function formatLinkText(sourceText, targetText) {
    return `from ${sourceText} to ${targetText}`;
}