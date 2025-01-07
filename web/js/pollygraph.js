import { Model } from './model.js';
import { View } from './view.js';
import { Controller } from './controller.js';
import { Router } from './router.js';
import { Searcher } from './searcher.js';
import { Informer } from './informer.js';


export function pollygraph(
    {
        graphSvgId = "", 
        datasourceInitialContent = "", 
        spiRootPath="", 
        datasourceRootPath="", 
        informerDivId="", 
        searchInputId="", 
        searchSuggestionsUlId="",
        nonDirectedEdgeTextFormatter=null,
        directedEdgeTextFormatter=null
    } = {}
) {  
    if (graphSvgId == "") {
        throw new Error('graphSvgId is required');
    }
    if (datasourceInitialContent == "") {
        throw new Error('datasourceInitialContent is required');
    }

    const model = new Model();
    const view = new View(graphSvgId, nonDirectedEdgeTextFormatter, directedEdgeTextFormatter);
    const controller = new Controller(model, view);

    const informer = informerDivId != "" ? new Informer(informerDivId) : null;
    const router = datasourceRootPath != "" ? new Router(spiRootPath, datasourceRootPath) : null;
    const searcher = searchInputId != "" ? new Searcher(controller, searchInputId, searchSuggestionsUlId) : null;

    controller.init(datasourceInitialContent, informer, router, searcher);
    return controller
}
