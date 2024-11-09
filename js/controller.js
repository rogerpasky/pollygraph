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

    // Actions -----------------------------------------------------------------

    focusNode(nodeId) {
        this.view.displayFocusOnNodeId(nodeId);
        this.traversingNearby = false;
        if (this.preFocusedNodeId) {
            this.view.displayUnfocusOnNodeId(this.preFocusedNodeId);
        }
        this.preFocusedNodeId = this.focusedNodeId = nodeId;
        this.focusedLinkId = null;
        console.log("Focused Node: " + this.focusedNodeId);
    }

    unfocusNode(nodeId) {
        if (this.traversingNearby) {
            this.view.displayPreFocusOnNodeId(nodeId);
        }
        else {
            this.view.displayUnfocusOnNodeId(nodeId);
        }
        console.log("Unfocused Node: " + nodeId);
    }

    focusLink(linkId) {  // TODO: it leaves the previous link pre-focused
        this.view.displayPreFocusOnNodeId(this.preFocusedNodeId);
        this.view.displayFocusOnLinkId(linkId);
        this.traversingNearby = false;
        this.focusedLinkId = linkId;
        this.focusedNodeId = null;
        console.log("Focused Link: " + this.focusedLinkId);
    }

    unfocusLink(linkId) {
        this.view.displayUnfocusOnLinkId(linkId);
        console.log("Unfocused Link: " + linkId);
    }

    focusForward() {
        if (this.focusedLinkId) {
            this.traversingNearby = false;
            const nodeId = this.model.getNodeIdOnOtherSide(this.preFocusedNodeId, this.focusedLinkId);
            this.history.push(this.focusedLinkId);
            this.view.displayUnfocusOnNodeId(this.preFocusedNodeId);
            this.view.findAndFocusElement(nodeId);
        }
        else {
            this.traversingNearby = true;
            const linkId = this.model.getFirstNonVisitedLinkId(this.focusedNodeId, this.history);
            if (linkId) {
                this.history.push(this.focusedNodeId);
                this.view.findAndFocusElement(linkId);
            }
            else {
                this.view.findAndFocusElement(this.focusedNodeId);
            }
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
            this.view.findAndFocusElement(this.model.getNextLinkId(this.preFocusedNodeId, this.focusedLinkId, 1));
        }
    }

    focusPrevious(levelMode) {
        if (levelMode) {
            console.log("Focus Previous Level");
        }
        else {
            this.view.findAndFocusElement(this.model.getNextLinkId(this.preFocusedNodeId, this.focusedLinkId, -1));
        }
    }

    focusDetails() {
        console.log("Focus Details");
    }
}
