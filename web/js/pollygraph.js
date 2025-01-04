import { Model } from './model.js';
import { View } from './view.js';
import { Controller } from './controller.js';
import { Router } from './router.js';


const model = new Model();
const view = new View();
const controller = new Controller(model, view);


export function pollygraph(datasourceInitialContent, spiRootPath="", datasourceRootPath="") {  
    const router = datasourceRootPath != "" ? new Router(spiRootPath, datasourceRootPath) : null;
    controller.init(datasourceInitialContent, router);
}

export function search(query) {
    const result = controller.search(query, 10);
    return result;
}
