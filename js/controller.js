export class Controller {
    constructor(model, view) {
        if (!model) {
            throw new Error('Model is required');
        }
        this.model = model;

        if (!view) {
            throw new Error('View is required');
        }
        this.view = view;

        this.view.setController(this);
        this.model.setController(this);

        this.focusedNodeId = null;
        this.preFocusedNodeId = null;
        this.focusedEdgeId = null;
        this.traversingNearby = false;
        this.history = [];
    }

    // Setup methods -----------------------------------------------------------

    init() {
    }

    // Event handlers ----------------------------------------------------------

    onDataChange(edgesData, nodesData) {
        this.focusedNodeId = nodesData[0].id;
        this.preFocusedNodeId = this.focusedNodeId;
        this.focusedEdgeId = null;
        this.traversingNearby = false;

        this.view.onDataChange(edgesData, nodesData);
        this.view.findAndFocusElement(this.focusedNodeId);
    }

    // Focus methods -----------------------------------------------------------

    focusNode(nodeId) {
        if (this.preFocusedNodeId) {
            this.view.displayUnFocusOnNodeId(this.preFocusedNodeId);
        }

        this.focusedNodeId = this.preFocusedNodeId = nodeId;

        this.view.displayPreFocusOnConnectedEdgesToNodeId(this.preFocusedNodeId);
        this.focusedEdgeId = null;

        this.view.displayFocusOnNodeId(this.focusedNodeId);
        this.view.displayElementInfo(this.focusedNodeId);
        console.log("Focused Node: " + this.focusedNodeId);
    }

    unFocusNode(nodeId) {
        if (this.traversingNearby) {
            this.view.displayPreFocusOnNodeId(nodeId);
        }
        else {
            this.view.displayUnFocusOnNodeId(nodeId);
        }
        console.log("UnFocused Node: " + nodeId);
    }

    focusEdge(edgeId) {
        this._cleanUpWhenFocusOnNonRelatedEdge(edgeId);

        this.focusedEdgeId = edgeId;

        this.view.displayFocusOnEdgeId(this.focusedEdgeId);
        this.view.displayElementInfo(this.focusedEdgeId);
        console.log("Focused Edge: " + this.focusedEdgeId);
    }

    unFocusEdge(edgeId) {
        if (this.traversingNearby) {
            this.view.displayPreFocusOnEdgeId(edgeId);
        }
        else {
            this.view.displayUnFocusOnEdgeId(edgeId);
        }
        console.log("UnFocused Edge: " + edgeId);
    }

    // Actions -----------------------------------------------------------------

    focusForward() {
        if (this.focusedEdgeId) {
            this._focusOnOtherSideToPrefocusedNode();
        }
        else if (this.focusedNodeId) {
            this.traversingNearby = true;
            this._focusOnFirstNonVisitedEdge();
            this.traversingNearby = false;
        }
        else {
            console.log("No focused element to go forward");
        }
        console.log("Focus Forward");
    }

    focusBackward() {
        if (this.history.length !== 0) {
            const element = this.history.pop();
            this.view.findAndFocusElement(element);
            console.log("Focus Backward");
        }
    }

    focusNext() {
        this.focusedEdgeId = this.model.getNextEdgeId(this.preFocusedNodeId, this.focusedEdgeId, 1);
        this.traversingNearby = true;
        this.view.findAndFocusElement(this.focusedEdgeId);
        this.traversingNearby = false;
    }

    focusPrevious() {
        this.focusedEdgeId = this.model.getNextEdgeId(this.preFocusedNodeId, this.focusedEdgeId, -1);
        this.traversingNearby = true;
        this.view.findAndFocusElement(this.focusedEdgeId);
        this.traversingNearby = false;
    }

    focusInner() {
        console.log("Focus Next Level");
        this.model.setDataFromInnerData(this.focusedNodeId ? this.focusedNodeId : this.preFocusedNodeId);
    }

    focusOuter() {
        console.log("Focus Previous Level");
        this.model.setDataFromOuterData();
    }

    focusDetails(backToGraph) {
        console.log("Focus Details");
        if (backToGraph) {
            if (this.focusedEdgeId) {
                this.view.findAndFocusElement(this.focusedEdgeId);
            }
            else {
                this.view.findAndFocusElement(this.focusedNodeId);
            }
        }
        else {
            this.traversingNearby = true;
            this.view.focusInfo();
            this.traversingNearby = false;
        }
    }

    getInfo(elementId) {
        return this.model.getInfo(elementId);
    }

    // Internal methods --------------------------------------------------------

    _focusOnOtherSideToPrefocusedNode() {
        // this.traversingNearby = false;
        const nodeId = this.model.getNodeIdOnOtherSide(this.preFocusedNodeId, this.focusedEdgeId);
        this.history.push(this.focusedEdgeId);
        this.view.displayUnFocusOnNodeId(this.preFocusedNodeId);
        this.view.findAndFocusElement(nodeId);
    }

    _focusOnFirstNonVisitedEdge() {
        const edgeId = this.model.getFirstNonVisitedEdgeId(this.focusedNodeId, this.history);
        if (edgeId) {
            this.history.push(this.focusedNodeId);
            this.view.findAndFocusElement(edgeId);
        }
        else {  // isolated node with no edges
            this.view.findAndFocusElement(this.focusedNodeId);
        }
    }

    _cleanUpWhenFocusOnNonRelatedEdge(edgeId) {
        if (!this.focusedEdgeId || this.traversingNearby) {
            return;
        }  // USE_CASE: when traversing outbound edges
        this.view.displayUnFocusOnNodeId(this.preFocusedNodeId);
        this.preFocusedNodeId = this.model.getNodeIdOnOtherSide("", edgeId);
        this.view.displayPreFocusOnNodeId(this.preFocusedNodeId);
        this.view.displayPreFocusOnConnectedEdgesToNodeId(this.preFocusedNodeId);
        this.focusedNodeId = null;
    }
}
