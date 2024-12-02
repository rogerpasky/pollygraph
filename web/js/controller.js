import { Model } from './model.js';
import { View } from './view.js';


export class Controller {
    constructor(model, view) {
        if (!model || model.constructor !== Model) {
            throw new Error('Model is required');
        }
        this.model = model;

        if (!view || view.constructor !== View) {
            throw new Error('View is required');
        }
        this.view = view;

        this.view.setController(this);
        this.model.setController(this);

        this.rootPath = null;
        this.focusedNodeId = null;
        this.preFocusedNodeId = null;
        this.focusedEdgeId = null;
        this.traversingNearby = false;
        this.history = [];
    }

    init(rootPath, datasource) {
        this.rootPath = rootPath;
        if (removeTrailingSlash(window.location.pathname) === rootPath) {
            this.model.setDataFromSource(datasource);
        }
        else {
            this.onUrlChange();
        }

        this.onUrlChange = this.onUrlChange.bind(this); // Bind the method to the class instance to avoid `this` confusion
        window.addEventListener('popstate', this.onUrlChange)
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
        // this.view.displayPreFocusOnConnectedEdgesToNodeId(this.preFocusedNodeId);
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

    focusDetails() {
        console.log("Focus Details");
        this.traversingNearby = true;
        this.view.focusInfo();
        this.traversingNearby = false;
    }

    focusBackFromDetails() {
        console.log("Focus Back From Details");
        if (this.focusedEdgeId) {
            this.view.findAndFocusElement(this.focusedEdgeId);
        }
        else {
            this.view.findAndFocusElement(this.focusedNodeId);
        }
    }

    getInfo(elementId) {
        return this.model.getInfo(elementId);
    }

    // Event handlers ----------------------------------------------------------

    onDataChange(data, focusedNodeId, dataSourcePath) {
        this._add_history(dataSourcePath);

        this.view.onDataChange(data, dataSourcePath);

        this.preFocusedNodeId = this.focusedNodeId = focusedNodeId;
        this.focusedEdgeId = null;
        this.traversingNearby = false;

        this.view.findAndFocusElement(this.focusedNodeId);
    }

    onUrlChange() {
        const path = window.location.pathname.replace(/\/$/, '', '');
        if (path.startsWith(this.rootPath)) {
            const datasource = "/srv" + path.replace(/\/$/, '', '');  // TODO: REVIEW!!!
            this.model.setDataFromSource(datasource);
        }
    }
    
    // Internal methods --------------------------------------------------------

    _add_history(dataSourcePath) {
        // modify the window history considering `this.roothPath` and `dataSourcePath` to reflect the current state. `dataSourcePath` can be a relative path or an absolute path, and it usually starts with the value of `this.rootPath`.
        if (dataSourcePath.startsWith("/srv" + this.rootPath)) {
            const currentPath = window.location.pathname;
            this._update_history(dataSourcePath.replace("/srv", ""), currentPath);
        }
        else {  // TODO: handle the case when dataSourcePath is a relative path or an absolute path that does not start with this.rootPath
            console.error(`The dataSourcePath ${dataSourcePath} is not a valid path`);
        }
    }

    _update_history(dataSourcePath, current_path) {
        if (current_path === this.rootPath) { // remove current history state and replace current path with the new one
            window.history.replaceState({}, '', dataSourcePath);
        }
        else {
            window.history.pushState({}, '', dataSourcePath);
        }
    }

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


function removeTrailingSlash(path) {
    return path.replace(/\/$/, '');
}