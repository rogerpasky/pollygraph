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
        this.history = [];
    }

    // Setup methods -----------------------------------------------------------

    init() {  // TODO: review if necessary
        this.view.currentFocusedNode = this.model.data.nodes[0];
        this.view.currentFocusedLink = this.model.data.links[0];
        this.view.currentFocusedLink.focus();
    }

    // Event handlers ----------------------------------------------------------

    onDataChange(linksData, nodesData) {
        this.focusedNodeId = linksData[0].id;
        this.focusedLinkId = nodesData[0].id;
        console.log(this.focusedNodeId);
        console.log(this.focusedLinkId);

        this.view.onDataChange(linksData, nodesData);
    }

    // Actions -----------------------------------------------------------------

    focusNode(nodeId) {  // TODO: review wether to reset history
        this.focusedNodeId = nodeId;
        this.preFocusedNodeId = this.focusedNodeId;
        this.focusedLinkId = null;
        console.log("Focused Node: " + this.focusedNodeId);
    }

    focusLink(linkId) {  // TODO: review wether to reset history
        this.focusedLinkId = linkId;
        this.focusedNodeId = null;
        console.log("Focused Link: " + this.focusedLinkId);
    }

    focusForward() {
        if (this.focusedLinkId) {
            const nodeId = this.model.getNodeIdOnOtherSide(this.preFocusedNodeId, this.focusedLinkId);
            this.history.push(this.focusedLinkId);
            this.view.displayUnfocusOnNodeId(this.preFocusedNodeId);
            this.view.findAndFocusElement(nodeId);
        }
        else {
            const linkId = this.model.getFirstNonVisitedLinkId(this.focusedNodeId, this.history);
            this.history.push(this.focusedNodeId);
            this.view.findAndFocusElement(linkId);
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
