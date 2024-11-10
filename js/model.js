import { data } from './default_data.js';


export class Model {
    constructor(dataSource = null) {
        this.controller = null;
        this.linksData = null;
        this.nodesData = null;

        this.setDataSource(dataSource ? dataSource : data);
    }

    setController(controller) {
        if (!controller) {
            throw new Error('Controller is required');
        }

        this.controller = controller;
        this.notifyDataChange()
    }

    setDataSource(dataSource) {
        if (!dataSource) {
            throw new Error('Data source is required');
        }

        let rawData = null;

        // if dataSource is a string, check if it is a URL and get a JSON object from it
        if (dataSource.constructor === String) {
            if (dataSource.startsWith('http')) {
                fetch(dataSource)
                    .then(response => response.json())
                    .then(data => this.data = data)
                    .catch(error => console.error('Error fetching data:', error));
            }
            // Otherwise, if the string is a JSON object, parse it
            else if (dataSource.startsWith('{')) {
                rawData = JSON.parse(dataSource);
            }
            else {
                throw new Error('Invalid data source');
            }
        }
        else if (dataSource.constructor === Object) {
            rawData = dataSource;
        }
        else {
            throw new Error('Invalid data source');
        }

        // TODO: review if needed
        // The force simulation mutates links and nodes, so create a copy
        // so that re-evaluating this cell produces the same result.
        this.linksData = rawData.links.map(d => ({...d, id: this.getLinkId(d)}));
        this.nodesData = rawData.nodes.map(d => ({...d}));

        this.notifyDataChange();
    }

    notifyDataChange() {
        if (this.controller) {
            this.controller.onDataChange(this.linksData, this.nodesData);
        }
    }

    getLinkId(linkData) {
        // TODO: check redundancies
        if (linkData.source.id < linkData.target.id) {
            return `${linkData.source} - ${linkData.target}`;
        }
        else {
            return `${linkData.target} - ${linkData.source}`;
        }
    }

    getFirstNonVisitedLinkId(focusedNodeId, history) {
        var linkData = this.linksData.find(data =>
            !history.includes(data.id) && ( data.source.id === focusedNodeId || data.target.id === focusedNodeId)
        );
        if (linkData) {  // first non-visited link found
            return linkData.id;
        }
        linkData = this.linksData.find(data =>
                data.source.id === focusedNodeId || data.target.id === focusedNodeId
        );
        if (linkData) {  // first link found
            return linkData.id;
        }
        else {
            return "";  // isolated node with no links
        }
    }

    getNodeIdOnOtherSide(focusedNodeId, focusedLinkId) {  // if no focusedNodeId, returns the source node id
        const linkData = this.linksData.find(linkData => linkData.id === focusedLinkId);
        return linkData.source.id === focusedNodeId ? linkData.target.id : linkData.source.id;
    }

    getNextLinkId(focusedNodeId, focusedLinkId, step) {
        const linkData = this.linksData.find(linkData => linkData.id === focusedLinkId);
        const linksData = this.linksData.filter(data =>
            focusedNodeId === data.source.id || focusedNodeId === data.target.id
        );
        const index = linksData.indexOf(linkData);
        return linksData[(index + step + linksData.length) % linksData.length].id;
    }
}
