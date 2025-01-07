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
    constructor(graphSvgId, nonDirectedEdgeTextFormatter, directedEdgeTextFormatter) {
        this._nonDirectedEdgeTextFormatter = nonDirectedEdgeTextFormatter || _defaultNonDirectedEdgeTextFormatter;
        this._directedEdgeTextFormatter = directedEdgeTextFormatter || _defaultDirectedEdgeTextFormatter;
        this._controller = null;
        this._edgesSelection = null;
        this._nodesSelection = null;
        this._simulation = null;
        this._keyModifierStatus = {"Shift": false, "Alt": false, "Control": false, "Meta": false, "CapsLock": false};
        this._svg = _getSvgSelection(graphSvgId);
        this._setKeyCallbacks();
        this._restart()
    }

    // Public methods ----------------------------------------------------------

    setController(controller) {
        this._controller = controller;
    }

    onDataChange(data) {
        this._restart();

        const edgesData = data.edges.map(edge => ({...edge}));  // A copy is done because view simulation appears to change source and target to the pointed objects instead its ids
        this._createEdges(edgesData);
        const nodesData = data.nodes;  // Nodes are created after edges to be painted on top
        this._createNodes(nodesData);
        this._createTitlesForVoiceOver();
        this._createSimulation(edgesData, nodesData);
    }

    // Displaying methods ------------------------------------------------------

    displayFocusOnNodeId(nodeId) {
        const node = _getElementFromSelection(nodeId, this._nodesSelection);
        _displayFocusOnNode(node);
    }

    displayPreFocusOnNodeId(nodeId) {
        const node = _getElementFromSelection(nodeId, this._nodesSelection);
        _displayPreFocusOnNode(node);
    }

    displayUnFocusOnNodeId(nodeId) {
        const node = _getElementFromSelection(nodeId, this._nodesSelection);
        _displayUnFocusOnNode(node);
    }

    displayFocusOnEdgeId(edgeId) {
        const edge = _getElementFromSelection(edgeId, this._edgesSelection);
        _displayFocusOnEdge(edge);
    }

    displayPreFocusOnEdgeId(edgeId) {
        const edge = _getElementFromSelection(edgeId, this._edgesSelection);
        _displayPreFocusOnEdge(edge);
    }

    displayUnFocusOnEdgeId(edgeId) {
        const edge = _getElementFromSelection(edgeId, this._edgesSelection);
        _displayUnFocusOnEdge(edge);
    }

    displayPreFocusOnConnectedEdgesToNodeId(nodeId) {
        const connectedEdges = this._selectConnectedEdges(nodeId);
        const classThis = this;  // to avoid DOM `this` confusion
        this._edgesSelection
            .selectAll(function(d) {
                const title = this.getElementsByTagName('title')[0];
                if (connectedEdges.nodes().includes(this)) {
                    _displayPreFocusOnEdge(this);
                    title.textContent = classThis._formatEdgeLabelStartingFromNodeId(d, nodeId, connectedEdges.nodes().indexOf(this)+1, connectedEdges.size());
                }
                else {
                    _displayUnFocusOnEdge(this);
                    title.textContent = classThis._formatEdgeLabelbetweenTwoNodeId(d);
                }
            });
    }

    // Find and Focus methods --------------------------------------------------

    findAndFocusElement(elementId) {
        if (!elementId) {
            return;
        }

        const element = _getElementFromSelection(elementId, this._svg.selectAll('circle, line'));
        if (! element) {
            console.error(`Element with id ${elementId} not found`);
            return;
        }

        console.log(`Focus on element with id ${elementId}`);
        element.focus();
    }

    // Setup methods -----------------------------------------------------------

    _restart() {
        if (this._simulation) {
            this._simulation.stop();
        }
        if (this._edgesSelection) {
            this._svg.select("#edges").remove();
        }
        if (this._nodesSelection) {
            this._svg.select("#nodes").remove();
        }
    }

    _setKeyCallbacks() {
        document.addEventListener("keydown", (event) => this._onKeydown(event.key));
        document.addEventListener("keyup", (event) => this._onKeyup(event.key));
    }

    _createNodes(nodesData) {
        var classThis = this;  // to avoid DOM `this` confusion
        this._nodesSelection = this._svg
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
    }

    _createEdges(edgesData) {
        var classThis = this;  // to avoid DOM `this` confusion
        this._edgesSelection = this._svg
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
    }

    _createTitlesForVoiceOver() {
        this._nodesSelection
            .append("title")
                .text(d => d.label ? d.label : d.id);
        this._edgesSelection
            .append("title")
            .text(d => this._formatEdgeLabelbetweenTwoNodeId(d));
    }

    _createSimulation(edgesData, nodesData) {
        // get a list of all node levels
        const levels = nodesData.map(d => d.level).filter((v, i, a) => a.indexOf(v) === i);

        var classThis = this;  // to avoid DOM `this` confusion
        // if (edgesData.length === nodesData.length * (nodesData.length - 1) / 2) {
        if (levels.length === 1 && levels[0] === 0) {  // cloudy graph
            this._simulation = d3.forceSimulation(nodesData)
                .force("link", d3.forceLink(edgesData).id(d => d.id).strength(0.9))
                .force("charge", d3.forceManyBody().strength(-5))
                .force("collide", d3.forceCollide(d => _getRadius(d) + 3))
                .on("tick", () => classThis._onTicked());
        }
        else if (levels.length === 1 && levels[0] > 0) {  // fully connected graph
            const sumOfAllRadius = nodesData.reduce((acc, d) => acc + _getRadius(d), 0);
            const radius = 2 * sumOfAllRadius / Math.PI;
            this._simulation = d3.forceSimulation(nodesData)
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
            this._simulation = d3.forceSimulation(nodesData)
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
        this._edgesSelection
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        this._nodesSelection
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }

    _adjustViewBox() {
        const minX = d3.min(this._nodesSelection.data(), d => d.x);
        const maxX = d3.max(this._nodesSelection.data(), d => d.x);
        const minY = d3.min(this._nodesSelection.data(), d => d.y);
        const maxY = d3.max(this._nodesSelection.data(), d => d.y);
        const width = maxX - minX;
        const height = maxY - minY;

        this._svg.attr("viewBox", [
            minX - MAX_RADIUS, 
            minY - MAX_RADIUS, 
            width + 2 * MAX_RADIUS, 
            height + 2 * MAX_RADIUS
        ]);
    }

    _onFocusNode(node) {
        const nodeId = node.getAttribute('id');
        this._controller.focusNode(nodeId);
    }

    _onBlurNode(node) {
        const nodeId = node.getAttribute('id');
        this._controller.unFocusNode(nodeId);
    }

    _onFocusEdge(edge) {
        const edgeId = edge.getAttribute('id');
        this._controller.focusEdge(edgeId);
    }

    _onBlurEdge(edge) {
        const edgeId = edge.getAttribute('id');
        this._controller.unFocusEdge(edgeId)
    }

    _onDoubleClickNode() {
        if (this._onlyShiftKeyPressed()) {
            this._controller.focusOuter();
        }
        else {
            this._controller.focusInner();
        }
    }

    _onKeydown(key) {
        if (!this._controller) {
            return;
        }
        else if (key === "ArrowRight" && this._noModifierKeyPressed()) {
            this._controller.focusForward();
        }
        else if (key === "ArrowLeft" && this._noModifierKeyPressed()) {
            this._controller.focusBackward();
        }
        else if (key === "ArrowUp" && this._noModifierKeyPressed()) {
            this._controller.focusPrevious();
        }
        else if (key === "ArrowDown" && this._noModifierKeyPressed()) {
            this._controller.focusNext();
        }
        else if (key === "Enter" && this._noModifierKeyPressed()) {
            this._controller.focusInner();
        }
        else if (key === "Enter" && this._onlyShiftKeyPressed()) {
            this._controller.focusOuter();
        }
        else if (key === "Escape" && this._noModifierKeyPressed()) {
            this._controller.focusBackToGraph();
        }
        else if (key in this._keyModifierStatus) {
            this._keyModifierStatus[key] = true;
        }
        else {
            console.log(`Unhandled Key pressed: ${key}\n${Object.entries(this._keyModifierStatus)}`);
        }
    }

    _onKeyup(key) {
        if (key in this._keyModifierStatus) {
            this._keyModifierStatus[key] = false;
        }
    }

    _noModifierKeyPressed() {
        return Object.values(this._keyModifierStatus).every(v => !v);
    }

    _onlyShiftKeyPressed() {
        return Object.values(this._keyModifierStatus).filter(v => v).length === 1 && this._keyModifierStatus["Shift"];
    }

    // Selection methods -------------------------------------------------------

    _selectConnectedEdges(nodeId) {
        return this._edgesSelection.filter(d => d.source.id === nodeId || d.target.id === nodeId);
    }

    // Formatting methods ------------------------------------------------------

    _formatEdgeLabelStartingFromNodeId(edgeData, fromNodeId, i, n) {
        const toNodeId = edgeData.source.id === fromNodeId ? edgeData.target.id : edgeData.source.id;

        const fromElement = _getElementFromSelection(fromNodeId, this._nodesSelection);
        const fromText = fromElement ? fromElement.getElementsByTagName('title')[0].textContent : fromNodeId;

        const toElement = _getElementFromSelection(toNodeId, this._nodesSelection);
        const toText = toElement ? toElement.getElementsByTagName('title')[0].textContent : toNodeId;

        return this._directedEdgeTextFormatter(fromText, toText, i, n);
    }

    _formatEdgeLabelbetweenTwoNodeId(edgeData) {
        if (edgeData.label) {
            return edgeData.label;
        }

        const fromNodeId = edgeData.source;
        const toNodeId = edgeData.target;

        const fromElement = _getElementFromSelection(fromNodeId, this._nodesSelection);
        const fromText = fromElement ? fromElement.getElementsByTagName('title')[0].textContent : fromNodeId;

        const toElement = _getElementFromSelection(toNodeId, this._nodesSelection);
        const toText = toElement ? toElement.getElementsByTagName('title')[0].textContent : toNodeId;

        return this._nonDirectedEdgeTextFormatter(fromText, toText);
    }
}


// Getter functions -------------------------------------------------------

function _getElementFromSelection(elementID, selection) {
    return selection.filter(d => d.id === elementID).node();
}

function _getWidth(element) {
    const computedStyle = window.getComputedStyle(element);
    return parseInt(computedStyle.width);
}

function _getHeight(element) {
    const computedStyle = window.getComputedStyle(element);
    return parseInt(computedStyle.height);
}

function _getSvgSelection(elementId) {
    return d3.select(`${elementId[0] !== "#" ? "#" : ""}${elementId}`);
}

function _getRadius(d) {
    return Math.sqrt(d.size) * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS;
}


// Visualization functions ----------------------------------------------------

function _displayFocusOnNode(node) {
    node.setAttribute('stroke', NODE_COLOR_FOCUSED);
    node.setAttribute('stroke-opacity', NODE_OPACITY_FOCUSED);
}

function _displayPreFocusOnNode(node) {
    node.setAttribute('stroke', NODE_COLOR_PREFOCUSED);
    node.setAttribute('stroke-opacity', NODE_OPACITY_PREFOCUSED);
}

function _displayUnFocusOnNode(node) {
    node.setAttribute('stroke', NODE_COLOR_UNFOCUSED);
    node.setAttribute('stroke-opacity', NODE_OPACITY_UNFOCUSED);
}

function _displayFocusOnEdge(edge) {
    edge.setAttribute('stroke', EDGE_COLOR_FOCUSED);
    edge.setAttribute('stroke-opacity', EDGE_OPACITY_FOCUSED);
}

function _displayPreFocusOnEdge(edge) {
    edge.setAttribute('stroke', EDGE_COLOR_PREFOCUSED);
    edge.setAttribute('stroke-opacity', EDGE_OPACITY_PREFOCUSED);
}

function _displayUnFocusOnEdge(edge) {
    edge.setAttribute('stroke', EDGE_COLOR_UNFOCUSED);
    edge.setAttribute('stroke-opacity', EDGE_OPACITY_UNFOCUSED);
}


// Default formatters ---------------------------------------------------------

function _defaultNonDirectedEdgeTextFormatter(sourceText, targetText) {
    return `${sourceText} - ${targetText}`;
}

function _defaultDirectedEdgeTextFormatter(fromText, toText, i, n) {
    const turnaround = i == 1 && n > 1 ? `first edge ` : '';
    const enumeration = n > 1 ? `, ${i} of ${n},` : '';
    return `${turnaround}to ${toText}${enumeration} from ${fromText}`;
}
