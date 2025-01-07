import { Model } from './model.js';
import { View } from './view.js';
import { Informer } from './informer.js';
import { Router } from './router.js';
import { Searcher } from './searcher.js';


export class Controller {
    constructor(model, view) {
        if (!model || model.constructor !== Model) {
            throw new Error('Model is required');
        }
        this._model = model;

        if (!view || view.constructor !== View) {
            throw new Error('View is required');
        }
        this._view = view;

        this._view.setController(this);
        this._model.setController(this);

        this._informer = null;
        this._router = null;
        this._searcher = null;
        this._focusedNodeId = null;
        this._preFocusedNodeId = null;
        this._focusedEdgeId = null;
        this._traversingNearby = false;
        this._currentDataSource = null;
        this._history = [];
    }

    init(datasourceInitialContent, informer=null, router=null, searcher=null) {
        if (informer && informer.constructor !== Informer) {
            throw new Error('Provided `informer` is not a proper Informer instance');
        }
        this._informer = informer;

        if (router && router.constructor !== Router) {
            throw new Error('Provided `router` is not a proper Router instance');
        }
        this._router = router;

        if (searcher && searcher.constructor !== Searcher) {
            throw new Error('Provided `searcher` is not a proper Searcher instance');
        }
        this._searcher = searcher;

        if (this._router) {
            const onUrlChangeCallback = this.setDataFromSource.bind(this)
            this._router.init(onUrlChangeCallback, datasourceInitialContent);
        }
        else {
            this._model.setDataFromSource(datasourceInitialContent);
        }
    }

    search(query, length, caseSensitive=false) {
        return this._model.search(query, this._currentDataSource, length);
    }

    // Focus methods -----------------------------------------------------------

    focusNode(nodeId) {
        if (this._preFocusedNodeId) {
            this._view.displayUnFocusOnNodeId(this._preFocusedNodeId);
        }

        this._focusedNodeId = this._preFocusedNodeId = nodeId;

        this._view.displayPreFocusOnConnectedEdgesToNodeId(this._preFocusedNodeId);
        this._focusedEdgeId = null;

        this._view.displayFocusOnNodeId(this._focusedNodeId);
        this._informer && this._informer.onInfoChange(this._model.getInfo(this._focusedNodeId));

        if (this._router && this._currentDataSource !== "") {  // TODO: handle clusters' paths
            this._router.route(this._currentDataSource, this._focusedNodeId);
        }
    
        console.log("Focused Node: " + this._focusedNodeId + " -----------------");
    }

    unFocusNode(nodeId) {
        if (this._traversingNearby) {
            this._view.displayPreFocusOnNodeId(nodeId);
        }
        else {
            this._view.displayUnFocusOnNodeId(nodeId);
        }
        console.log("UnFocused Node: " + nodeId);
    }

    focusEdge(edgeId) {
        this._cleanUpWhenFocusOnNonRelatedEdge(edgeId);

        this._focusedEdgeId = edgeId;

        this._view.displayFocusOnEdgeId(this._focusedEdgeId);
        this._informer && this._informer.onInfoChange(this._model.getInfo(this._focusedEdgeId));
        console.log("Focused Edge: " + this._focusedEdgeId);
    }

    unFocusEdge(edgeId) {
        if (this._traversingNearby) {
            this._view.displayPreFocusOnEdgeId(edgeId);
        }
        else {
            this._view.displayUnFocusOnEdgeId(edgeId);
        }
        console.log("UnFocused Edge: " + edgeId);
    }

    // Actions -----------------------------------------------------------------

    setDataFromSource(dataSourcePath, focusedNodeId="", fromRouter=false) {
        if (this._currentDataSource === dataSourcePath) {
            this.onDataChange(null, dataSourcePath, focusedNodeId, fromRouter)
        }
        else {
            this._model.setDataFromSource(dataSourcePath, focusedNodeId, fromRouter);
        }
    }

    focusForward() {
        if (this._focusedEdgeId) {
            this._focusOnOtherSideToPrefocusedNode();
        }
        else if (this._focusedNodeId) {
            this._traversingNearby = true;
            this._focusOnFirstNonVisitedEdge();
            this._traversingNearby = false;
        }
        else {
            console.log("No focused element to go forward");
        }
        console.log("Focus Forward");
    }

    focusBackward() {
        if (this._history.length !== 0) {
            const element = this._history.pop();
            this._view.findAndFocusElement(element);
            console.log("Focus Backward");
        }
    }

    focusNext() {
        this._focusedEdgeId = this._model.getNextEdgeId(this._preFocusedNodeId, this._focusedEdgeId, 1);
        // this.view.displayPreFocusOnConnectedEdgesToNodeId(this.preFocusedNodeId);
        this._traversingNearby = true;
        this._view.findAndFocusElement(this._focusedEdgeId);
        this._traversingNearby = false;
    }

    focusPrevious() {
        this._focusedEdgeId = this._model.getNextEdgeId(this._preFocusedNodeId, this._focusedEdgeId, -1);
        this._traversingNearby = true;
        this._view.findAndFocusElement(this._focusedEdgeId);
        this._traversingNearby = false;
    }

    focusInner() {
        console.log("Focus Next Level");
        this._model.setDataFromInnerData(this._focusedNodeId ? this._focusedNodeId : this._preFocusedNodeId);
    }

    focusOuter() {
        console.log("Focus Previous Level");
        this._model.setDataFromOuterData();
    }

    focusBackToGraph() {
        console.log("Focus Back To Graph");
        if (this._focusedEdgeId) {
            this._view.findAndFocusElement(this._focusedEdgeId);
        }
        else {
            this._view.findAndFocusElement(this._focusedNodeId);
        }
    }

    // Event handlers ----------------------------------------------------------

    onDataChange(data, dataSourcePath, focusedNodeId, fromRouter=false) {
        console.log("Controller: onDataChange");

        this._currentDataSource = dataSourcePath;

        // if (this.router && dataSourcePath !== "") {  // TODO: handle clusters' paths
        //     this.router.route(dataSourcePath, focusedNodeId, fromRouter);
        // }

        if (data) {
            this._view.onDataChange(data);
        }

        this.onFocusChange(focusedNodeId);
    }

    onFocusChange(focusedNodeId) {
        this._preFocusedNodeId = this._focusedNodeId = focusedNodeId;
        this._focusedEdgeId = null;
        this._traversingNearby = false;

        this._view.findAndFocusElement(this._focusedNodeId);
    }
    
    // Internal methods --------------------------------------------------------

    _focusOnOtherSideToPrefocusedNode() {
        // this.traversingNearby = false;
        const nodeId = this._model.getNodeIdOnOtherSide(this._preFocusedNodeId, this._focusedEdgeId);
        this._history.push(this._focusedEdgeId);
        this._view.displayUnFocusOnNodeId(this._preFocusedNodeId);
        this._view.findAndFocusElement(nodeId);
    }

    _focusOnFirstNonVisitedEdge() {
        const edgeId = this._model.getFirstNonVisitedEdgeId(this._focusedNodeId, this._history);
        if (edgeId) {
            this._history.push(this._focusedNodeId);
            this._view.findAndFocusElement(edgeId);
        }
        else {  // isolated node with no edges
            this._view.findAndFocusElement(this._focusedNodeId);
        }
    }

    _cleanUpWhenFocusOnNonRelatedEdge(edgeId) {
        if (!this._focusedEdgeId || this._traversingNearby) {
            return;
        }  // USE_CASE: when traversing outbound edges
        this._view.displayUnFocusOnNodeId(this._preFocusedNodeId);
        this._preFocusedNodeId = this._model.getNodeIdOnOtherSide("", edgeId);
        this._view.displayPreFocusOnNodeId(this._preFocusedNodeId);
        this._view.displayPreFocusOnConnectedEdgesToNodeId(this._preFocusedNodeId);
        this._focusedNodeId = null;
    }
}
