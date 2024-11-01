import { Model } from './model.js';
import { View } from './view.js';
import { Controller } from './controller.js';


const model = new Model();
const view = new View();
const controler = new Controller(model, view);


export function traverseGraph(dataSource = null) {
    model.setDataSource(dataSource);
    controler.init();
}
