import { defaultData } from './default_data.js';


export class Model {
    constructor(dataSource = null) {
        this.controller = null;
        this.data = null;

        this.setDataSource(dataSource ? dataSource : defaultData);
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
                    .then(data => this._setNewData(data))
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

        this._setNewData(this._normalizeData(rawData));
    }

    _normalizeData(rawData) {
        rawData.nodes = rawData.nodes.map(node => _getNewNode(node.id, node.label, node.group, node.size, node.info));
        rawData.edges = rawData.edges.map(edge => ({...edge, id: _getEdgeId(edge.source, edge.target)}));
        // TODO: think about the outer data
        const nestedData = _getClusteredData(rawData);

        const nonUnitaryCluster = nestedData.nodes.find(node => node.inner.nodes.length > 1);

        const nodes = nonUnitaryCluster.inner.nodes.map(node => _getNewNode(node.id, node.label, node.group, node.size, node.info));
        const edges = nonUnitaryCluster.inner.edges.map(edge => ({...edge, id: _getEdgeId(edge.source, edge.target)}));
        const outer = nestedData;
        return {nodes, edges, outer};
    }

    _setNewData(data) {
        this.data = data;

        this.notifyDataChange();
    }

    setOuterData() {
        if (this.data.outer) {
            this._setNewData(
                {
                    nodes: this.data.outer.nodes, 
                    edges: this.data.outer.edges, 
                    outer: this.data.outer
                }
            );  // FIXME: outer should be Null sometimes
        }
    }

    setInnerData(nodeId) {
        const node = this.data.nodes.find(n => n.id === nodeId);
        if (node && node.inner) {
            this._setNewData(
                {
                    nodes: node.inner.nodes, 
                    edges: node.inner.edges, 
                    outer: this.data
                }
            );
        }
    }

    notifyDataChange() {
        if (this.controller) {
            this.controller.onDataChange(  // TODO: review why it is needed to do a copy of the data
                this.data.edges.map(d => ({...d})), 
                this.data.nodes.map(d => ({...d}))
            );
        }
    }

    getFirstNonVisitedEdgeId(focusedNodeId, history) {
        var edgeData = this.data.edges.find(data =>
            !history.includes(data.id) && (data.source === focusedNodeId || data.target === focusedNodeId)
        );
        if (edgeData) {  // first non-visited edge found
            return edgeData.id;
        }
        edgeData = this.data.edges.find(data =>
                data.source === focusedNodeId || data.target === focusedNodeId
        );
        if (edgeData) {  // first edge found
            return edgeData.id;
        }
        else {
            return "";  // isolated node with no edges
        }
    }

    getNodeIdOnOtherSide(focusedNodeId, focusedEdgeId) {  // if no focusedNodeId, returns the source node id
        const edgeData = this.data.edges.find(edgeData => edgeData.id === focusedEdgeId);
        return edgeData.source === focusedNodeId ? edgeData.target : edgeData.source;
    }

    getNextEdgeId(focusedNodeId, focusedEdgeId, step) {
        const edgeData = this.data.edges.find(edgeData => edgeData.id === focusedEdgeId);
        const edgesData = this.data.edges.filter(data =>
            focusedNodeId === data.source || focusedNodeId === data.target
        );
        if (!edgesData) {
            return "";
        }
        const index = edgesData.indexOf(edgeData);
        return edgesData[(index + step + edgesData.length) % edgesData.length].id;
    }
}


function _getClusteredData(rawData) {
    const outerData = { nodes: [], edges: [], outer: null };
    const nodeClusters =  clusterizeNodes(rawData.nodes, rawData.edges);
    const maxSize = nodeClusters.reduce((max, cluster) => Math.max(max, cluster.length), 0);
    const minSize = nodeClusters.reduce((min, cluster) => Math.min(min, cluster.length), maxSize);

    var i = 0;
    for (const cluster of nodeClusters) {
        const clusterIds = cluster.map(node => node.id);
        const innerData = {nodes: [], edges: [], outer: outerData};
        innerData.nodes.push(...cluster);
        innerData.edges.push(...rawData.edges.filter(edge => clusterIds.includes(edge.source) && clusterIds.includes(edge.target)));
        const outerNode = _getNewNode(`C.${i}`, `Cluster ${i}, ${cluster.length} nodes`, i, (cluster.length - minSize) / (maxSize - minSize), "", innerData);
        const newEdges = getNewEdges(outerNode, outerData.nodes);
        if (newEdges.length > 0) {
            outerData.edges.push(...newEdges);
        }
        outerData.nodes.push(outerNode);
        i++;
    }
    return outerData;
}


function _getNewNode(id, label, group, size = 0.5, info = "", inner = null) {
    return {
        id, 
        label, 
        group, 
        size, 
        info, 
        inner
    };
}

function getNewEdges(node, targetNodes) {
    return targetNodes.map(
        target => (
            {
                // id: getEdgeId(node.id, target.id),
                source: node.id, 
                target: target.id, 
                // label: "",
                // group: 0,
                size: 1,
                info: "",
                inner: ""
            }
        )
    );
}

// TODO: create clusters of unitary clusters
function clusterizeNodes(nodes, edges) {
    const clusters = [];
    const visited = new Set();

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            const cluster = [];
            dfs(nodes, edges, visited, node, cluster);
            clusters.push(cluster);
        }
    }

    return clusters;
}


function dfs(nodes, edges, visited, node, cluster) {
    visited.add(node.id);
    cluster.push(node);
    const relatedEdges = edges.filter(edge => edge.source === node.id || edge.target === node.id);
    const relatedNodes = relatedEdges.map(edge => edge.source === node.id ? edge.target : edge.source);
    for (const relatedNodeId of relatedNodes) {
        const relatedNode = nodes.find(n => n.id === relatedNodeId);
        if (relatedNode && !visited.has(relatedNode.id)) {
            dfs(nodes, edges, visited, relatedNode, cluster);
        }
    }
}

function _getEdgeId(source, target) {
    // TODO: check redundancies
    if (source < target) {
        return `${source} - ${target}`;
    }
    else {
        return `${target} - ${source}`;
    }
}
