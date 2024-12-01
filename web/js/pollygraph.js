import { Model } from './model.js';
import { View } from './view.js';
import { Controller } from './controller.js';


const model = new Model();
const view = new View();
const controller = new Controller(model, view);

const rootPath = window.location.pathname;


export function pollygraph(initialDatasource) {    
    model.setDataFromSource(initialDatasource);
    window.addEventListener('popstate', onUrlChange)
}

function onUrlChange() {
    const path = window.location.pathname;
    if (path.startsWith(rootPath)) {
        const datasource = path.replace(rootPath, '');
        model.setDataFromSource(datasource);
    }
}
