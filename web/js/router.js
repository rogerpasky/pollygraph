import { Controller } from './controller.js';

// Following class is responsible for routing the Single page application in order to do both
// client side and server side routing, i.e. to navigate between different pages of the application
// reflecting the right path in the browser's address bar and to handle the back and forward buttons.
// on the other hand, going to a bookmarked page will be handled by the server side routing.
export class Router {
    constructor() {
        this.controller = null;
        this.spiRootPath = null;
        this.datasourceRootPath = null;

        console.log("Router constructor");
    }

    init(controller, spiRootPath, datasourceRootPath, datasourceInitialContent) {
        console.log("Router init begins");

        if (!controller || controller.constructor !== Controller) {
            throw new Error('Controller is required');
        }
        this.controller = controller;

        this.spiRootPath = removeTrailingSlash(spiRootPath);
        this.datasourceRootPath = removeTrailingSlash(datasourceRootPath);

        if (removeTrailingSlash(window.location.pathname) === spiRootPath) {
            this.controller.model.setDataFromSource(datasourceInitialContent);
        }
        else {
            this.onUrlChange();
        }

        this.onUrlChange = this.onUrlChange.bind(this);
        window.addEventListener('popstate', this.onUrlChange)
        console.log("Router init ends");
    }

    // This method is responsible for routing the application
    // based on the current path in the browser's address bar
    // and the routes defined in the routes object.
    route() {
        const path = removeTrailingSlash(window.location.pathname);
        if (path.startsWith(this.spiRootPath)) {
            const datasource = this.datasourceRootPath + path.replace(this.spiRootPath, '');
            this.model.setDataFromSource(datasource);
        }

    }

    // This method is responsible for handling the back and forward buttons
    // by listening to the popstate event.
    // listen() {
    //     window.addEventListener("popstate", () => {
    //         this.route();
    //     });
    // }

    // This method is responsible for navigating to a new path
    // by pushing a new state to the history object
    // onUrlChange(path) {
    //     window.history.pushState(null, "", path);
    //     this.route();
    // }

    onUrlChange() {
        const path = removeTrailingSlash(window.location.pathname);
        if (path.startsWith(this.spiRootPath)) {
            const datasource = this.datasourceRootPath + path.replace(this.spiRootPath, '');
            this.controller.model.setDataFromSource(datasource);
        }
    }

    _add_history(dataSourcePath) {
        // modify the window history considering `this.roothPath` and `dataSourcePath` to reflect the current state. `dataSourcePath` can be a relative path or an absolute path, and it usually starts with the value of `this.spiRootPath`.
        if (dataSourcePath.startsWith(this.datasourceRootPath)) {
            const currentPath = window.location.pathname;
            this._update_history(dataSourcePath.replace(this.datasourceRootPath, this.spiRootPath), currentPath);
        }
        else {  // TODO: handle the case when dataSourcePath is a relative path or an absolute path that does not start with this.spiRootPath
            console.error(`The dataSourcePath "${dataSourcePath}" is not a valid path`);
        }
    }

    _update_history(dataSourcePath, current_path) {
        const parts = current_path.split('/').filter(part => part.length > 0);
        document.title = parts[parts.length - 1];

        if (current_path === this.spiRootPath) { // remove current history state and replace current path with the new one
            window.history.replaceState({}, '', dataSourcePath);
        }
        else {
            window.history.pushState({}, '', dataSourcePath);
        }
    }

}


function removeTrailingSlash(path) {
    return path.replace(/\/$/, '');
}
