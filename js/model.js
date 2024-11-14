import { data } from './default_data.js';


export class Model {
    constructor(dataSource = null) {
        this.controller = null;
        this.data = null;

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

        const nestedData = getClusteredData(rawData);

        const nonUnitaryCluster = nestedData.nodes.find(node => node.inner.nodes.length > 1);

        this.setNewData(
            {
                nodes: nonUnitaryCluster.inner.nodes, 
                links: nonUnitaryCluster.inner.links, 
                outer: nestedData
            }
        );
    }

    setNewData(data) {
        // TODO: review if needed
        // The force simulation mutates links and nodes, so create a copy
        // so that re-evaluating this cell produces the same result.
        this.data = {
            nodes: data.nodes,
            links: data.links.map(d => ({...d, id: getLinkId(d.source, d.target)})),
            outer: data.outer
        }

        this.notifyDataChange();
    }

    setOuterData() {
        if (this.data.outer) {
            this.setNewData(
                {
                    nodes: this.data.outer.nodes, 
                    links: this.data.outer.links, 
                    outer: this.data.outer
                }
            );  // FIXME: outer should be Null sometimes
        }
    }

    setInnerData(nodeId) {
        const node = this.data.nodes.find(n => n.id === nodeId);
        if (node && node.inner) {
            this.setNewData(
                {
                    nodes: node.inner.nodes, 
                    links: node.inner.links, 
                    outer: this.data
                }
            );
        }
    }

    notifyDataChange() {
        if (this.controller) {
            this.controller.onDataChange(
                this.data.links.map(d => ({...d})), 
                this.data.nodes.map(d => ({...d}))
            );
        }
    }

    getFirstNonVisitedLinkId(focusedNodeId, history) {
        var linkData = this.data.links.find(data =>
            !history.includes(data.id) && (data.source === focusedNodeId || data.target === focusedNodeId)
        );
        if (linkData) {  // first non-visited link found
            return linkData.id;
        }
        linkData = this.data.links.find(data =>
                data.source === focusedNodeId || data.target === focusedNodeId
        );
        if (linkData) {  // first link found
            return linkData.id;
        }
        else {
            return "";  // isolated node with no links
        }
    }

    getNodeIdOnOtherSide(focusedNodeId, focusedLinkId) {  // if no focusedNodeId, returns the source node id
        const linkData = this.data.links.find(linkData => linkData.id === focusedLinkId);
        return linkData.source === focusedNodeId ? linkData.target : linkData.source;
    }

    getNextLinkId(focusedNodeId, focusedLinkId, step) {
        const linkData = this.data.links.find(linkData => linkData.id === focusedLinkId);
        const linksData = this.data.links.filter(data =>
            focusedNodeId === data.source || focusedNodeId === data.target
        );
        if (!linksData) {
            return "";
        }
        const index = linksData.indexOf(linkData);
        return linksData[(index + step + linksData.length) % linksData.length].id;
    }
}


function getClusteredData(rawData) {
    const outerData = { nodes: [], links: [], outer: null };
    const nodeClusters =  clusterizeNodes(rawData.nodes, rawData.links);
    const maxSize = nodeClusters.reduce((max, cluster) => Math.max(max, cluster.length), 0);
    const minSize = nodeClusters.reduce((min, cluster) => Math.min(min, cluster.length), maxSize);

    var i = 0;
    for (const cluster of nodeClusters) {
        const clusterIds = cluster.map(node => node.id);
        const innerData = {nodes: [], links: [], outer: outerData};
        innerData.nodes.push(...cluster);
        innerData.links.push(...rawData.links.filter(link => clusterIds.includes(link.source) && clusterIds.includes(link.target)));
        const outerNode = getNewNode(`C.${i}`, `Cluster ${i}, ${cluster.length} nodes`, i, (cluster.length - minSize) / (maxSize - minSize), "", innerData);
        const newLinks = getNewLinks(outerNode, outerData.nodes);
        if (newLinks.length > 0) {
            outerData.links.push(...newLinks);
        }
        outerData.nodes.push(outerNode);
        i++;
    }
    return outerData;
}


function getNewNode(id, label, group, size = 0.5, info = "", inner = {}) {
    return {
        id, 
        label, 
        group, 
        size, 
        info, 
        inner
    };
}

function getNewLinks(node, targetNodes) {
    return targetNodes.map(
        target => (
            {
                // id: getLinkId(node.id, target.id),
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


function clusterizeNodes(nodes, links) {
    const clusters = [];
    const visited = new Set();

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            const cluster = [];
            dfs(nodes, links, visited, node, cluster);
            clusters.push(cluster);
        }
    }

    return clusters;
}


function dfs(nodes, links, visited, node, cluster) {
    visited.add(node.id);
    cluster.push(node);
    const relatedLinks = links.filter(link => link.source === node.id || link.target === node.id);
    const relatedNodes = relatedLinks.map(link => link.source === node.id ? link.target : link.source);
    for (const relatedNodeId of relatedNodes) {
        const relatedNode = nodes.find(n => n.id === relatedNodeId);
        if (relatedNode && !visited.has(relatedNode.id)) {
            dfs(nodes, links, visited, relatedNode, cluster);
        }
    }
}

function getLinkId(source, target) {
    // TODO: check redundancies
    if (source < target) {
        return `${source} - ${target}`;
    }
    else {
        return `${target} - ${source}`;
    }
}
