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
        this.focusedLinkId = null;
        this.traversingNearby = false;
        this.history = [];
    }

    // Setup methods -----------------------------------------------------------

    init() {
    }

    // Event handlers ----------------------------------------------------------

    onDataChange(linksData, nodesData) {
        this.focusedNodeId = linksData[0].id;
        this.focusedLinkId = nodesData[0].id;

        this.view.onDataChange(linksData, nodesData);
        this.focusedNodeId = nodesData[0].id;
        this.preFocusedNodeId = nodesData[0].id;
        this.view.findAndFocusElement(this.focusedNodeId);
    }

    // Focus methods -----------------------------------------------------------

    focusNode(nodeId) {
        if (this.preFocusedNodeId) {
            this.view.displayUnFocusOnNodeId(this.preFocusedNodeId);
        }

        this.focusedNodeId = this.preFocusedNodeId = nodeId;

        this.view.displayPreFocusOnConnectedLinksToNodeId(this.preFocusedNodeId);
        this.focusedLinkId = null;

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

    focusLink(linkId) {
        this._cleanUpWhenFocusOnNonRelatedLink(linkId);

        this.focusedLinkId = linkId;

        this.view.displayFocusOnLinkId(this.focusedLinkId);
        this.view.displayElementInfo(this.focusedLinkId);
        console.log("Focused Link: " + this.focusedLinkId);
    }

    unFocusLink(linkId) {
        if (this.traversingNearby) {
            this.view.displayPreFocusOnLinkId(linkId);
        }
        else {
            this.view.displayUnFocusOnLinkId(linkId);
        }
        console.log("UnFocused Link: " + linkId);
    }

    // Actions -----------------------------------------------------------------

    focusForward() {
        if (this.focusedLinkId) {
            this._focusOnOtherSideToPrefocusedNode();
        }
        else if (this.focusedNodeId) {
            this.traversingNearby = true;
            this._focusOnFirstNonVisitedLink();
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

    focusNext(levelMode) {
        if (levelMode) {
            console.log("Focus Next Level");
        }
        else {
            this.focusedLinkId = this.model.getNextLinkId(this.preFocusedNodeId, this.focusedLinkId, 1);
            this.traversingNearby = true;
            this.view.findAndFocusElement(this.focusedLinkId);
            this.traversingNearby = false;
        }
    }

    focusPrevious(levelMode) {
        if (levelMode) {
            console.log("Focus Previous Level");
        }
        else {
            this.focusedLinkId = this.model.getNextLinkId(this.preFocusedNodeId, this.focusedLinkId, -1);
            this.traversingNearby = true;
            this.view.findAndFocusElement(this.focusedLinkId);
            this.traversingNearby = false;
        }
    }

    focusDetails() {
        console.log("Focus Details");
    }

    // Internal methods --------------------------------------------------------

    _focusOnOtherSideToPrefocusedNode() {
        // this.traversingNearby = false;
        const nodeId = this.model.getNodeIdOnOtherSide(this.preFocusedNodeId, this.focusedLinkId);
        this.history.push(this.focusedLinkId);
        this.view.displayUnFocusOnNodeId(this.preFocusedNodeId);
        this.view.findAndFocusElement(nodeId);
    }

    _focusOnFirstNonVisitedLink() {
        const linkId = this.model.getFirstNonVisitedLinkId(this.focusedNodeId, this.history);
        if (linkId) {
            this.history.push(this.focusedNodeId);
            this.view.findAndFocusElement(linkId);
        }
        else {  // isolated node with no links
            this.view.findAndFocusElement(this.focusedNodeId);
        }
    }

    _cleanUpWhenFocusOnNonRelatedLink(linkId) {
        if (!this.focusedLinkId || this.traversingNearby) {
            return;
        }  // USE_CASE: when traversing outbound links
        this.view.displayUnFocusOnNodeId(this.preFocusedNodeId);
        this.preFocusedNodeId = this.model.getNodeIdOnOtherSide("", linkId);
        this.view.displayPreFocusOnNodeId(this.preFocusedNodeId);
        this.view.displayPreFocusOnConnectedLinksToNodeId(this.preFocusedNodeId);
        this.focusedNodeId = null;
    }
}
