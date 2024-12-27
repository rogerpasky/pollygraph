import { Model } from './model.js';
import { View } from './view.js';
import { Controller } from './controller.js';
import { Router } from './router.js';


const model = new Model();
const view = new View();
const router = new Router();
const controller = new Controller(model, view, router);


export function pollygraph(spiRootPath, datasourceRootPath, datasourceInitialContent) {  
    controller.init(spiRootPath, datasourceRootPath, datasourceInitialContent);
}
