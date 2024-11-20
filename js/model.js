import { defaultData } from './default_data.js';


export class Model {
    constructor(dataSource = null) {
        this._controller = null;
        this._data = null;

        this.setDataSource(dataSource ? dataSource : defaultData);
    }

    setController(controller) {
        if (!controller) {
            throw new Error('Controller is required');
        }

        this._controller = controller;
        this._notifyDataChange()
    }

    setDataSource(dataSource) {
        if (!dataSource) {
            throw new Error('Data source is required');
        }

        let rawData = null;

        // if dataSource is a string, check if it is an URL and get a JSON object from it
        if (dataSource.constructor === String) {
            if (dataSource.startsWith('http')) {
                fetch(dataSource)
                    .then(response => response.json())
                    .then(data => this._setNewData(this._normalizeData(data)))
                    .catch(error => console.error('Error fetching data:', error));
                return;
            }
            // Otherwise, if the string is a JSON object, parse it
            else if (dataSource.startsWith('{')) {
                rawData = JSON.parse(dataSource);
            }
            else {
                throw new Error('Invalid string data source (should be an URL or a JSON string)');
            }
        }
        else if (dataSource.constructor === Object) {
            rawData = dataSource;
        }
        else {
            throw new Error('Invalid data source (should be a string or an object)');
        }

        this._setNewData(this._normalizeData(rawData));
    }

    setDataFromOuterData() {
        if (this._data.outer) {
            this._setNewData(
                {
                    nodes: this._data.outer.nodes, 
                    edges: this._data.outer.edges, 
                    outer: this._data.outer
                }
            );  // FIXME: outer should be Null sometimes
        }
    }

    setDataFromInnerData(nodeId) {
        const node = this._data.nodes.find(n => n.id === nodeId);
        if (node && node.inner) {
            this._setNewData(
                {
                    nodes: node.inner.nodes, 
                    edges: node.inner.edges, 
                    outer: this._data
                }
            );
        }
    }

    getFirstNonVisitedEdgeId(focusedNodeId, history) {
        var edgeData = this._data.edges.find(data =>
            !history.includes(data.id) && (data.source === focusedNodeId || data.target === focusedNodeId)
        );
        if (edgeData) {  // first non-visited edge found
            return edgeData.id;
        }
        edgeData = this._data.edges.find(data =>
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
        const edgeData = this._data.edges.find(edgeData => edgeData.id === focusedEdgeId);
        return edgeData.source === focusedNodeId ? edgeData.target : edgeData.source;
    }

    getNextEdgeId(focusedNodeId, focusedEdgeId, step) {
        const edgeData = this._data.edges.find(edgeData => edgeData.id === focusedEdgeId);
        const edgesData = this._data.edges.filter(data =>
            focusedNodeId === data.source || focusedNodeId === data.target
        );
        if (!edgesData) {
            return "";
        }
        const index = edgesData.indexOf(edgeData);
        return edgesData[(index + step + edgesData.length) % edgesData.length].id;
    }

    // Internal methods --------------------------------------------------------

    _setNewData(data) {
        console.log('New data:', data);
        this._data = data;
        this._notifyDataChange();
    }

    _notifyDataChange() {
        if (! this._controller) {
            return;
        }

        this._controller.onDataChange(  // TODO: review why it is needed to do a copy of the data
            this._data.edges.map(d => ({...d})), 
            this._data.nodes.map(d => ({...d}))
        );
    }

    _normalizeData(rawData) {
        rawData.nodes = rawData.nodes.map(node => _getNewNode(node.id, node.label, node.group, node.size, node.info));
        rawData.edges = rawData.edges.map(edge => ({...edge, id: _getEdgeId(edge.source, edge.target)}));
        // TODO: think about the outer data
        const nestedGraph = _getNestedGraph(rawData);
        return nestedGraph;

        // const nonUnitaryCluster = nestedGraph.nodes.find(node => node.inner.nodes.length > 1);

        // const nodes = nonUnitaryCluster.inner.nodes.map(node => _getNewNode(node.id, node.label, node.group, node.size, node.info));
        // const edges = nonUnitaryCluster.inner.edges.map(edge => ({...edge, id: _getEdgeId(edge.source, edge.target)}));
        // const outer = nestedGraph;
        // return _getNewGraph(nodes, edges, outer);
    }
}


function _getNewGraph(nodes, edges, outer = null) {
    return {
        // id, 
        nodes, 
        edges, 
        // label, 
        // info, 
        outer
    };  // TODO: think about an id (for history track), a label and some info
}


function _getNewNode(id, label = "", group = 0, size = 0.5, info = "", inner = null) {
    label = label ? label : id;
    return {
        id, 
        label, 
        group, 
        size, 
        info, 
        inner
    };
}


function _getNewEdgesFromSourceNode(sourceNode, targetNodes) {
    return targetNodes.map(
        targetNode => (
            {
                id: _getEdgeId(sourceNode.id, targetNode.id),
                source: sourceNode.id, 
                target: targetNode.id, 
                // label: "",
                // group: 0,
                size: 1,  // TODO: review in the [0..1] range
                info: "",
                inner: ""
            }  // TODO: think about an id, a label and a group
        )
    );
}


function _getNestedGraph(rawData, outerGraph=null) {
    const nodesClusters =  _clusterizeNodes(rawData.nodes, rawData.edges);

    const nonUnitaryClusters = nodesClusters.filter(cluster => cluster.length > 1);
    const unitaryClusters = nodesClusters.filter(cluster => cluster.length === 1);
    const unitaryClustersGraph = _getClusteredGraph(unitaryClusters, rawData.edges, null, "Unitary_Cluster");

    var nonUnitaryEdges = rawData.edges.map(edge => ({...edge}));
    if (unitaryClustersGraph.nodes.length > 0) {
        nonUnitaryClusters.push(unitaryClustersGraph.nodes);
        nonUnitaryEdges = nonUnitaryEdges.concat(unitaryClustersGraph.edges);
    }

    return _getClusteredGraph(nonUnitaryClusters, nonUnitaryEdges, outerGraph, "Cluster");
}


function _getClusteredGraph(nodesClusters, allEdges, outerGraph, label) {
    const maxSizeCluster = nodesClusters.reduce((max, cluster) => Math.max(max, cluster.length), 0);
    const minSizeCluster = nodesClusters.reduce((min, cluster) => Math.min(min, cluster.length), maxSizeCluster);

    var i = 0;
    const clusteredGraph = _getNewGraph([], [], outerGraph);
    for (const innerNodes of nodesClusters) {
        innerNodes.sort((a, b) => a.label.localeCompare(b.label));
        const innerNodesIds = innerNodes.map(node => node.id);
        const innerEdges = allEdges.filter(edge => innerNodesIds.includes(edge.source) && innerNodesIds.includes(edge.target));
        const innerGraph = _getNewGraph(innerNodes, innerEdges, clusteredGraph);

        const clusterNodeSize = maxSizeCluster !== minSizeCluster ? (innerNodes.length - minSizeCluster) / (maxSizeCluster - minSizeCluster) : 0.5;  // bounded to [0, 1]

        const clusterNode = _getNewNode(`${label}_${i}`, `${label} ${i}, ${innerNodes.length} nodes, from ${innerNodes[0].label} to ${innerNodes[innerNodes.length - 1].label}`, i, clusterNodeSize, "", innerGraph);

        const clusterNodeEdges = _getNewEdgesFromSourceNode(clusterNode, clusteredGraph.nodes);
        if (clusterNodeEdges.length > 0) {
            clusteredGraph.edges.push(...clusterNodeEdges);
        }
        clusteredGraph.nodes.push(clusterNode);
        i++;
    }

    return clusteredGraph;
}


function _clusterizeNodes(nodes, edges) {
    const clusters = [];
    const visited = new Set();

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            const cluster = [];
            _dfs(nodes, edges, visited, node, cluster);
            clusters.push(cluster);
        }
    }

    return clusters;
}


function _dfs(nodes, edges, visited, node, cluster) {
    visited.add(node.id);
    cluster.push(node);
    const relatedEdges = edges.filter(edge => edge.source === node.id || edge.target === node.id);
    const relatedNodes = relatedEdges.map(edge => edge.source === node.id ? edge.target : edge.source);
    for (const relatedNodeId of relatedNodes) {
        const relatedNode = nodes.find(n => n.id === relatedNodeId);
        if (relatedNode && !visited.has(relatedNode.id)) {
            _dfs(nodes, edges, visited, relatedNode, cluster);
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
