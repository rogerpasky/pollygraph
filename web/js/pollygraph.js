import { Model } from './model.js';
import { View } from './view.js';
import { Controller } from './controller.js';
import { Router } from './router.js';
import { Searcher } from './searcher.js';


const model = new Model();
const view = new View();
const controller = new Controller(model, view);
const searcher = new Searcher(controller, "search-input", "search-suggestions");


export function pollygraph(datasourceInitialContent, spiRootPath="", datasourceRootPath="") {  
    const router = datasourceRootPath != "" ? new Router(spiRootPath, datasourceRootPath) : null;
    controller.init(datasourceInitialContent, router);
}
