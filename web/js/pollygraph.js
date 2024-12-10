import { Model } from './model.js';
import { View } from './view.js';
import { Controller } from './controller.js';


const model = new Model();
const view = new View();
const controller = new Controller(model, view);


export function pollygraph(rootPath, initialDatasource) {  
    controller.init(rootPath, initialDatasource);
}