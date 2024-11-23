// Specify the color scale.
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Specify visual constants
const NODE_BORDER_WIDTH = 1.5;
const MAX_RADIUS = 20;
const MIN_RADIUS = 2;

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
        edgeTextFormatter = null,
        directedEdgeTextFormatter = null,
    ) {
        this.controller = null;
        this.edgesGroup = null;
        this.nodesGroup = null;
        this.simulation = null;
        this.svg = this._getDomSvg();
        this.infoDiv = this._getInfoDiv();
        this.shiftPressed = false;
        this.altPressed = false;
        this.controlPressed = false;
        this.metaPressed = false;
        this.capsLockPressed = false;
        this._setKeyCallbacks();
        this.edgeTextFormatter = edgeTextFormatter || _defaultEdgeTextFormatter;
        this.directedEdgeTextFormatter = directedEdgeTextFormatter || _defaultDirectedEdgeTextFormatter;
        this._restart()
    }

    // Public methods ----------------------------------------------------------

    setController(controller) {
        this.controller = controller;
    }

    onDataChange(edgesData, nodesData) {
        this._restart();
        this._createEdges(edgesData);
        this._createNodes(nodesData);
        this._createSimulation(edgesData, nodesData);

        this.currentFocusedNode = this.nodesGroup.nodes()[0];
        this.currentFocusedEdge = this._selectConnectedEdges(this.currentFocusedNode).nodes()[0];    
    }

    // Displaying methods ------------------------------------------------------

    displayFocusOnNodeId(nodeId) {
        const node = document.getElementById(nodeId);
        this._displayFocusOnNode(node);
    }

    displayPreFocusOnNodeId(nodeId) {
        const node = document.getElementById(nodeId);
        this._displayPreFocusOnNode(node);
    }

    displayUnFocusOnNodeId(nodeId) {
        const node = document.getElementById(nodeId);
        this._displayUnFocusOnNode(node);
    }

    displayFocusOnEdgeId(edgeId) {
        const edge = document.getElementById(edgeId);
        this._displayFocusOnEdge(edge);
    }

    displayPreFocusOnEdgeId(edgeId) {
        const edge = document.getElementById(edgeId);
        this._displayPreFocusOnEdge(edge);
    }

    displayUnFocusOnEdgeId(edgeId) {
        const edge = document.getElementById(edgeId);
        this._displayUnFocusOnEdge(edge);
    }

    displayPreFocusOnConnectedEdgesToNodeId(nodeId) {  // TODO: optimize
        const connectedEdges = this._selectConnectedEdges(nodeId);
        this.edgesGroup
            .selectAll("title")
                .text(d => this._formatEdgeLabelbetweenTwoNodeId(d.source.id, d.target.id));
        connectedEdges
            .select("title")
                .text(d => this._formatEdgeLabelStartingFromNodeId(d, nodeId))
        this.edgesGroup
            .selectAll(function() {
                this.setAttribute('stroke', LINK_COLOR_UNFOCUSED);
                if (connectedEdges.nodes().includes(this)) {
                    this.setAttribute('stroke-opacity', LINK_OPACITY_PREFOCUSED);
                }
                else {
                    this.setAttribute('stroke-opacity', LINK_OPACITY_UNFOCUSED);
                }
            });
    }

    displayElementInfo(elementId) {
        const text = this.controller.getInfo(elementId);
        this.infoDiv.innerHTML = text;
    }

    // Find and Focus methods --------------------------------------------------

    findAndFocusElement(elementId) {
        if (!elementId) {
            return;
        }
        const element = document.getElementById(elementId);
        if (element) {
            console.log(`Focus on element with id ${elementId}`);
            element.focus();
        }
        else {
            console.error(`Element with id ${elementId} not found`);
        }
    }

    focusInfo() {
        this.infoDiv.focus();
    }

    // Setup methods -----------------------------------------------------------

    _restart() {
        if (this.simulation) {
            this.simulation.stop();
        }
        if (this.edgesGroup) {
            this.svg.select("#edges").remove();
        }
        if (this.nodesGroup) {
            this.svg.select("#nodes").remove();
        }
    }

    _setKeyCallbacks() {
        d3.select("body")
            .on("keydown", (event) => this._onKeydown(event.key))
            .on("keyup", (event) => this._onKeyup(event.key));
    }

    _getWidth(element) {
        const computedStyle = window.getComputedStyle(element);
        return parseInt(computedStyle.width);
    }

    _getHeight(element) {
        const computedStyle = window.getComputedStyle(element);
        return parseInt(computedStyle.height);
    }

    _getDomSvg() {
        return d3.select('#the-graph');
    }

    _getInfoDiv() {
        const div = document.getElementById('info');
        div.setAttribute('tabindex', 0);
        return div;
    }

    _createNodes(nodesData) {
        var classThis = this;  // to avoid DOM `this` confusion
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
                .attr('r', d => _getRadius(d))
                .attr('fill', d => color(d.type))
                // .on("click", (event) => console.log(`Click on ${event.target}`))
                .on('focus', (event) => classThis._onFocusNode(event.target))
                .on('blur', (event) => classThis._onBlurNode(event.target))
                .on('dblclick', () => classThis._onDoubleClickNode());

        this.nodesGroup
            .append("title")
                .text(d => d.label ? d.label : d.id);
    }

    _createEdges(edgesData) {
        var classThis = this;  // to avoid DOM `this` confusion
        this.edgesGroup = this.svg
            .append("g")
            .attr('id', 'edges')
            .selectAll()
            .data(edgesData)
            .join("line")
                .attr('id', d => d.id)
                .attr('role', 'treeitem')
                .attr('class', 'arc')
                .attr('tabindex', 0)  // needed for Safari and Firefox
                .attr("stroke", LINK_COLOR_UNFOCUSED)
                .attr("stroke-opacity", LINK_OPACITY_UNFOCUSED)
                .attr("stroke-width", d => Math.sqrt(d.size))
                .on('focus', (event) => classThis._onFocusEdge(event.target))
                .on('blur', (event) => classThis._onBlurEdge(event.target));
        this.edgesGroup
            .append("title")
            .text(d => this._formatEdgeLabelbetweenTwoNodeId(d.source, d.target));
        }

    _createSimulation(edgesData, nodesData) {
        const width = this._getWidth(this.svg.node());
        const height = this._getHeight(this.svg.node());

        var classThis = this;  // to avoid DOM `this` confusion
        this.simulation = d3.forceSimulation(nodesData)
            .force("edge", d3.forceLink(edgesData).id(d => d.id).strength(0.9))
            .force("charge", d3.forceManyBody().strength(-4))
            // .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(d => _getRadius(d) + 3))
            .on("tick", () => classThis._onTicked());
    }

    // DOM Event handlers ------------------------------------------------------

    _onTicked() {
        this._relocateElements();
        this._adjustViewBox();
    }

    _relocateElements() {
        this.edgesGroup
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        this.nodesGroup
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }

    _adjustViewBox() {
        const minX = d3.min(this.nodesGroup.data(), d => d.x);
        const maxX = d3.max(this.nodesGroup.data(), d => d.x);
        const minY = d3.min(this.nodesGroup.data(), d => d.y);
        const maxY = d3.max(this.nodesGroup.data(), d => d.y);
        const width = maxX - minX;
        const height = maxY - minY;

        this.svg.attr("viewBox", [
            minX - MAX_RADIUS, 
            minY - MAX_RADIUS, 
            width + 2 * MAX_RADIUS, 
            height + 2 * MAX_RADIUS
        ]);
    }

    _onFocusNode(node) {
        const nodeId = node.getAttribute('id');
        this.controller.focusNode(nodeId);
    }

    _onBlurNode(node) {
        const nodeId = node.getAttribute('id');
        this.controller.unFocusNode(nodeId);
    }

    _onFocusEdge(edge) {
        const edgeId = edge.getAttribute('id');
        this.controller.focusEdge(edgeId);
    }

    _onBlurEdge(edge) {
        const edgeId = edge.getAttribute('id');
        this.controller.unFocusEdge(edgeId)
    }

    _onDoubleClickNode() {
        if (this.shiftPressed) {
            this.controller.focusOuter();
        }
        else {
            this.controller.focusInner();
        }
    }

    _onKeydown(key) {
        if (!this.controller) {
            return;
        }
        else if (key === "ArrowRight" && this._noModifierKeyPressed()) {
            this.controller.focusForward();
        }
        else if (key === "ArrowLeft" && this._noModifierKeyPressed()) {
            this.controller.focusBackward();
        }
        else if (key === "ArrowUp" && this._noModifierKeyPressed()) {
            this.controller.focusPrevious(this._onlyShiftKeyPressed());
        }
        else if (key === "ArrowDown" && this._noModifierKeyPressed()) {
            this.controller.focusNext();
        }
        else if (key === "Enter" && this._noModifierKeyPressed()) {
            this.controller.focusInner();
        }
        else if (key === "Enter" && this._onlyShiftKeyPressed()) {
            this.controller.focusOuter();
        }
        else if (key === " " && this._noModifierKeyPressed()) {
            this.controller.focusDetails();
        }
        else if (key === "Escape" && this._noModifierKeyPressed()) {
            this.controller.focusBackFromDetails();
        }
        else if (key === "Shift") {
            this.shiftPressed = true;
        }
        else if (key === "Alt") {
            this.altPressed = true;
        }
        else if (key === "Control") {
            this.controlPressed = true;
        }
        else if (key === "Meta") {
            this.metaPressed = true;
        }
        else if (key === "CapsLock") {
            this.capsLockPressed = true;
        }
        else {
            console.log(`Unhandled Key pressed: ${key}\n{shift: ${this.shiftPressed}, alt: ${this.altPressed}, control: ${this.controlPressed}, meta: ${this.metaPressed}, capsLock: ${this.capsLockPressed}}`);
        }
    }

    _onKeyup(key) {
        if (key === "Shift") {
            this.shiftPressed = false;
        }
        else if (key === "Alt") {
            this.altPressed = false;
        }
        else if (key === "Control") {
            this.controlPressed = false;
        }
        else if (key === "Meta") {
            this.metaPressed = false;
        }
        else if (key === "CapsLock") {
            this.capsLockPressed = false;
        }
    }

    _noModifierKeyPressed() {
        return !this.shiftPressed && !this.altPressed && !this.controlPressed && !this.metaPressed && !this.capsLockPressed;
    }

    _onlyShiftKeyPressed() {
        return this.shiftPressed && !this.altPressed && !this.controlPressed && !this.metaPressed && !this.capsLockPressed;
    }

    // Visualization methods ---------------------------------------------------

    _displayFocusOnNode(node) {
        node.setAttribute('stroke', NODE_COLOR_FOCUSED);
        node.setAttribute('stroke-opacity', NODE_OPACITY_FOCUSED);
    }

    _displayPreFocusOnNode(node) {
        node.setAttribute('stroke', NODE_COLOR_PREFOCUSED);
        node.setAttribute('stroke-opacity', NODE_OPACITY_PREFOCUSED);
    }

    _displayUnFocusOnNode(node) {
        node.setAttribute('stroke', NODE_COLOR_UNFOCUSED);
        node.setAttribute('stroke-opacity', NODE_OPACITY_UNFOCUSED);
    }

    _displayFocusOnEdge(edge) {
        edge.setAttribute('stroke', LINK_COLOR_FOCUSED);
        edge.setAttribute('stroke-opacity', LINK_OPACITY_FOCUSED);
    }

    _displayPreFocusOnEdge(edge) {
        edge.setAttribute('stroke', LINK_COLOR_PREFOCUSED);
        edge.setAttribute('stroke-opacity', LINK_OPACITY_PREFOCUSED);
    }

    _displayUnFocusOnEdge(edge) {
        edge.setAttribute('stroke', LINK_COLOR_UNFOCUSED);
        edge.setAttribute('stroke-opacity', LINK_OPACITY_UNFOCUSED);
    }

    // Selection methods -------------------------------------------------------

    _selectConnectedEdges(nodeId) {
        return this.edgesGroup.filter(d => d.source.id === nodeId || d.target.id === nodeId);
    }

    // Formatting methods ------------------------------------------------------

    _formatEdgeLabelStartingFromNodeId(edgeData, fromNodeId) {
        if (edgeData.source.id === fromNodeId) {
            var toNodeId = edgeData.target.id;
        }
        else {
            var toNodeId = edgeData.source.id;
        }
        const fromText = document.getElementById(fromNodeId).getElementsByTagName('title')[0].textContent;
        const toText = document.getElementById(toNodeId).getElementsByTagName('title')[0].textContent;
        return this.directedEdgeTextFormatter(fromText, toText);
    
    }

    _formatEdgeLabelbetweenTwoNodeId(sourceId, targetId) {
        const sourceElement = document.getElementById(sourceId)
        const sourceText = sourceElement ? sourceElement.getElementsByTagName('title')[0].textContent : sourceId;
        const targetElement = document.getElementById(targetId)
        const targetText = targetElement ? targetElement.getElementsByTagName('title')[0].textContent : targetId;
        return this.edgeTextFormatter(sourceText, targetText);
    }
}

// Default formatters ---------------------------------------------------------

function _defaultEdgeTextFormatter(sourceText, targetText) {
    return `${sourceText} - ${targetText}`;
}

function _defaultDirectedEdgeTextFormatter(fromText, toText) {
    return `from ${fromText} to ${toText}`;
}

function _getRadius(d) {
    return Math.sqrt(d.size) * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS;
}
