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

const EDGE_COLOR_FOCUSED = '#f00';
const EDGE_OPACITY_FOCUSED = 1.0;

const EDGE_COLOR_PREFOCUSED = '#999';
const EDGE_OPACITY_PREFOCUSED = 0.9;

const EDGE_COLOR_UNFOCUSED = '#999';
const EDGE_OPACITY_UNFOCUSED = 0.2;


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
        this.toFormater = _defaultTo;
        this.fromFormater = _defaultFrom;
        this.nFormater = _defaultN;
        this._restart()
    }

    // Public methods ----------------------------------------------------------

    setController(controller) {
        this.controller = controller;
    }

    onDataChange(data, dataSourcePath) {
        this._restart();
        const edgesData = data.edges.map(edge => ({...edge}));  // TODO: review the need for a copy, because view simulation appears to change source and target to the pointed objects instead its ids
        this._createEdges(edgesData);

        const nodesData = data.nodes;  // Nodes are created after edges to be painted on top
        this._createNodes(nodesData);

        this._createSimulation(edgesData, nodesData);
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

    displayPreFocusOnConnectedEdgesToNodeId(nodeId) {
        const connectedEdges = this._selectConnectedEdges(nodeId);
        const classThis = this;  // to avoid DOM `this` confusion
        this.edgesGroup
            .selectAll(function(d) {
                const title = this.getElementsByTagName('title')[0];
                if (connectedEdges.nodes().includes(this)) {
                    classThis._displayPreFocusOnEdge(this);
                    title.textContent = classThis._formatEdgeLabelStartingFromNodeId(d, nodeId, connectedEdges.nodes().indexOf(this)+1, connectedEdges.size());
                }
                else {
                    classThis._displayUnFocusOnEdge(this);
                    title.textContent = classThis._formatEdgeLabelbetweenTwoNodeId(d);
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
                .attr("stroke", EDGE_COLOR_UNFOCUSED)
                .attr("stroke-opacity", EDGE_OPACITY_UNFOCUSED)
                .attr("stroke-width", d => d.size)
                .on('focus', (event) => classThis._onFocusEdge(event.target))
                .on('blur', (event) => classThis._onBlurEdge(event.target));
        this.edgesGroup
            .append("title")
            .text(d => this._formatEdgeLabelbetweenTwoNodeId(d));
        }

    _createSimulation(edgesData, nodesData) {
        // get a list of all node levels
        const levels = nodesData.map(d => d.level).filter((v, i, a) => a.indexOf(v) === i);

        var classThis = this;  // to avoid DOM `this` confusion
        // if (edgesData.length === nodesData.length * (nodesData.length - 1) / 2) {
        if (levels.length === 1 && levels[0] === 0) {  // cloudy graph
            this.simulation = d3.forceSimulation(nodesData)
                .force("link", d3.forceLink(edgesData).id(d => d.id).strength(0.9))
                .force("charge", d3.forceManyBody().strength(-5))
                .force("collide", d3.forceCollide(d => _getRadius(d) + 3))
                .on("tick", () => classThis._onTicked());
        }
        else if (levels.length === 1 && levels[0] > 0) {  // fully connected graph
            const sumOfAllRadius = nodesData.reduce((acc, d) => acc + _getRadius(d), 0);
            const radius = 2 * sumOfAllRadius / Math.PI;
            this.simulation = d3.forceSimulation(nodesData)
                .force("link", d3.forceLink(edgesData).id(d => d.id).strength(0))
                .force("collide", d3.forceCollide(d => _getRadius(d) + 3))
                .force("r", d3.forceRadial(radius))
                .on("tick", () => classThis._onTicked());
        }
        else {  // layered graph, probably a tree
            // FIXME: following code doesn't work
            const maxX = levels.map(() => 0);
            nodesData.forEach((node) => {
                node.x = 100 * (maxX[node.level]++);
                node.y = node.level * 30;
            });
            this.simulation = d3.forceSimulation(nodesData)
                .force("link", d3.forceLink(edgesData).id(d => d.id).strength(0.1))
                .force("charge", d3.forceManyBody().strength(-50))
                .force("collide", d3.forceCollide(d => _getRadius(d) + 3))
                .force("y", d3.forceY(d => d.level * 100))
                .on("tick", () => classThis._onTicked());
        }
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
        edge.setAttribute('stroke', EDGE_COLOR_FOCUSED);
        edge.setAttribute('stroke-opacity', EDGE_OPACITY_FOCUSED);
    }

    _displayPreFocusOnEdge(edge) {
        edge.setAttribute('stroke', EDGE_COLOR_PREFOCUSED);
        edge.setAttribute('stroke-opacity', EDGE_OPACITY_PREFOCUSED);
    }

    _displayUnFocusOnEdge(edge) {
        edge.setAttribute('stroke', EDGE_COLOR_UNFOCUSED);
        edge.setAttribute('stroke-opacity', EDGE_OPACITY_UNFOCUSED);
    }

    // Selection methods -------------------------------------------------------

    _selectConnectedEdges(nodeId) {
        return this.edgesGroup.filter(d => d.source.id === nodeId || d.target.id === nodeId);
    }

    // Formatting methods ------------------------------------------------------

    _formatEdgeLabelStartingFromNodeId(edgeData, fromNodeId, i, n) {
        if (edgeData.source.id === fromNodeId) {
            var toNodeId = edgeData.target.id;
        }
        else {
            var toNodeId = edgeData.source.id;
        }
        const fromText = document.getElementById(fromNodeId).getElementsByTagName('title')[0].textContent;
        const toText = document.getElementById(toNodeId).getElementsByTagName('title')[0].textContent;
        return `${this.toFormater(toText)}, ${this.nFormater(i, n)}, ${this.fromFormater(fromText)}`;
    }

    _formatEdgeLabelbetweenTwoNodeId(edgeData) {
        if (edgeData.label) {
            return edgeData.label;
        }
        const sourceId = edgeData.source.id;
        const targetId = edgeData.target.id;
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

function _defaultFrom(fromText) {
    return `from ${fromText}`;
}

function _defaultTo(toText) {
    return `to ${toText}`;
}

function _defaultN(i, n) {
    return `${i} of ${n}`;
}

function _getRadius(d) {
    return Math.sqrt(d.size) * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS;
}
