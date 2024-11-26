const HELP_DATA_SOURCE = './graphs/help-1';


export class Model {
    constructor(dataSource = null) {
        this._controller = null;
        this._data = null;

        if (dataSource) {
            this.setDataSource(dataSource);
        }
    }

    // Public methods ----------------------------------------------------------

    setDataSource(dataSource = null) {
        if (! dataSource) {
            throw new Error('Data source is required');
        }

        let rawData = null;

        // if dataSource is a string, check if it is an URL and get a JSON object from it
        if (dataSource.constructor === String) {
            if (dataSource.startsWith('http') || dataSource.startsWith('./')) {
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

    // Actions -----------------------------------------------------------------

    setController(controller = null) {
        if (! controller) {
            throw new Error('Controller is required');
        }

        this._controller = controller;
        this._notifyDataChange()
    }

    setDataFromOuterData() {
        if (this._data.outer) {
            this.setDataSource(this._data.outer);
        }
    }

    setDataFromInnerData(nodeId) {
        const node = this._data.nodes.find(n => n.id === nodeId);
        if (node && node.inner) {
            this.setDataSource(node.inner);
        }
    }

    getFirstNonVisitedEdgeId(focusedNodeId, history) {
        var edgeData = this._data.edges.find(edge =>
            ! history.includes(edge.id) && (edge.source === focusedNodeId || edge.target === focusedNodeId)
        );
        if (edgeData) {  // first non-visited edge found
            return edgeData.id;
        }
        edgeData = this._data.edges.find(edge =>
            edge.source === focusedNodeId || edge.target === focusedNodeId
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
        if (edgesData.length === 0) {
            return "";
        }
        const index = edgesData.indexOf(edgeData);
        return edgesData[(index + step + edgesData.length) % edgesData.length].id;
    }

    getInfo(elementId) {
        const node = this._data.nodes.find(node => node.id === elementId);
        if (node) {
            return node.info ? node.info : node.label;
        }
        const edge = this._data.edges.find(edge => edge.id === elementId);
        if (edge) {
            return edge.info ? edge.info : edge.id;
        }
        // TODO: get graph info when available
        return "";
    }

    // Internal methods --------------------------------------------------------

    _setNewData(data) {
        console.log('New data:', data);
        this._data = data;
        this._notifyDataChange();
    }

    _notifyDataChange() {
        if (! this._controller || ! this._data) {
            return;
        }

        this._controller.onDataChange(  // TODO: review the need for a copy, because view simulation appears to change source and target to the pointed objects instead its ids
            this._data.edges.map(edge => ({...edge})), 
            this._data.nodes.map(node => ({...node}))
        );
    }

    _normalizeData(rawData) {
        rawData.nodes = rawData.nodes.map(node => _getNewNode(node.id, node.label, node.type, node.size, node.info, node.inner));
        rawData.edges = rawData.edges.map(edge => _getNewEdge(edge.source, edge.target, edge.id, edge.label, edge.size, edge.info));  // TODO: check redundancies
        const nestedGraph = _getNestedGraph(rawData);
        return nestedGraph;
    }
}


function _getNewGraph(nodes, edges, outer = "") {
    const maxSize = nodes.reduce((max, node) => Math.max(max, node.size), 0);
    const minSize = nodes.reduce((min, node) => Math.min(min, node.size), maxSize);
    nodes.forEach(node => node.size = normalizeSize(node.size, minSize, maxSize));
    return {
        // id, 
        nodes, 
        edges, 
        // label, 
        // info, 
        outer
    };  // TODO: think about an id (for history track), a label and some info
}


export function normalizeSize(size, minSize, maxSize) {
    return maxSize !== minSize ? (size - minSize) / (maxSize - minSize) : 0.5;  // bounded to [0, 1]
}


function _getNewNode(id, label, type, size, info, inner) {
    label = label ? label : id;
    type = type !== undefined ? type : 0;
    size = size !== undefined ? size : 0.5;
    info = info ? info : "";
    inner = inner ? inner : "";
    return {
        id, 
        label, 
        type, 
        size, 
        info, 
        inner
    };
}


function _getNewEdge(source, target, id, label, size, info) {
    id = id ? id : _getEdgeId(source, target);
    label = label ? label : id;
    size = size ? size : 0.5;
    info = info ? info : "";
    return {
        source, 
        target, 
        id,
        label,
        // type: 0,
        size,  // TODO: review in the [0..1] range
        info, 
        // inner
    }
}


function _getNewEdgesFromSourceNode(sourceNode, targetNodes) {
    return targetNodes.map(
        targetNode => (
            {
                id: _getEdgeId(sourceNode.id, targetNode.id),
                source: sourceNode.id, 
                target: targetNode.id, 
                // label: "",
                // type: 0,
                size: 1,  // TODO: review in the [0..1] range
                info: "",
                inner: ""
            }  // TODO: think about an id, a label and a type
        )
    );
}


function _getNestedGraph(rawData, outerGraph="") {
    const nodesClusters =  _clusterizeNodes(rawData.nodes, rawData.edges);

    const nonUnitaryClusters = nodesClusters.filter(cluster => cluster.length > 1);
    const unitaryClusters = nodesClusters.filter(cluster => cluster.length === 1);
    if (
        (nonUnitaryClusters.length === 0 && unitaryClusters.length === 1) ||  // Single node graph
        (nonUnitaryClusters.length === 1 && unitaryClusters.length === 0)     // Connected graph
    ) {
        return _getNewGraph(rawData.nodes, rawData.edges, rawData.outer ? rawData.outer : outerGraph);
    }

    const unitaryClustersGraph = _getClusteredGraph(unitaryClusters, rawData.edges, outerGraph, "Unitary_Cluster");
    if (nonUnitaryClusters.length === 0) {  // All nodes are unitary
        return unitaryClustersGraph;
    }
    
    const allClusters = nonUnitaryClusters.concat([unitaryClustersGraph.nodes]);
    const allEdges = rawData.edges.concat(unitaryClustersGraph.edges);

    const clusteredGraph = _getClusteredGraph(allClusters, allEdges, outerGraph, "Cluster");
    unitaryClustersGraph.outer = clusteredGraph;
    return clusteredGraph;
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

        const clusterNodeSize = normalizeSize(innerNodes.length, minSizeCluster, maxSizeCluster);

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
        if (! visited.has(node.id)) {
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
        if (relatedNode && ! visited.has(relatedNode.id)) {
            _dfs(nodes, edges, visited, relatedNode, cluster);
        }
    }
}


function _getEdgeId(source, target) {
    if (source < target) {
        return `${source} - ${target}`;
    }
    else {
        return `${target} - ${source}`;
    }
}
