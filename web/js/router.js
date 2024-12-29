// Following class is responsible for routing the Single page application in order to do both
// client side and server side routing, i.e. to navigate between different pages of the application
// reflecting the right path in the browser's address bar and to handle the back and forward buttons.
// on the other hand, going to a bookmarked page will be handled by the server side routing.
export class Router {
    constructor(spiRootPath, datasourceRootPath) {
        this.spiRootPath = removeTrailingSlash(spiRootPath);
        this.datasourceRootPath = removeTrailingSlash(datasourceRootPath);
        this.setDataFromSource = null;

        console.log("Router constructor");  // TODO: remove this line
    }

    init(setDataFromSource) {
        console.log("Router init begins");  // TODO: remove this line

        this.setDataFromSource = setDataFromSource
        this._listenToBackAndForward();


        // if (removeTrailingSlash(window.location.pathname) === spiRootPath) {
        //     this.controller.model.setDataFromSource(datasourceInitialContent);
        // }
        // else {
        //     this.route();
        // }

        console.log("Router init ends");  // TODO: remove this line
    }

    // This method is responsible for routing the application
    // based on the current path in the browser's address bar
    // and the routes defined in the routes object.
    route() {
        console.log("Router route begins");  // TODO: remove this line

        const path = removeTrailingSlash(window.location.pathname);
        if (path.startsWith(this.spiRootPath)) {
            const datasource = this.datasourceRootPath + path.replace(this.spiRootPath, '');
            console.log(`Router route:  ${path} => ${datasource}`);  // TODO: remove this line
            this.setDataFromSource(datasource);
        }

        console.log("Router route ends");  // TODO: remove this line
    }

    setNewDataOnUrl(dataSourcePath) {
        console.log("Router _add_history begins");  // TODO: remove this line

        // modify the window history considering `this.roothPath` and `dataSourcePath` to reflect the current state. `dataSourcePath` can be a relative path or an absolute path, and it usually starts with the value of `this.spiRootPath`.
        if (dataSourcePath.startsWith(this.datasourceRootPath)) {
            const currentPath = window.location.pathname;
            this._update_history(dataSourcePath.replace(this.datasourceRootPath, this.spiRootPath), currentPath);
        }
        else {  // TODO: handle the case when dataSourcePath is a relative path or an absolute path that does not start with this.spiRootPath
            console.error(`The dataSourcePath "${dataSourcePath}" is not a valid path`);
        }

        console.log("Router _add_history ends");  // TODO: remove this line
    }

    _listenToBackAndForward() {
        window.addEventListener('popstate', this.route.bind(this))
    }

    // This method is responsible for navigating to a new path
    // by pushing a new state to the history object
    // onUrlChange(path) {
    //     window.history.pushState(null, "", path);
    //     this.route();
    // }

    _update_history(dataSourcePath, current_path) {
        console.log("Router _update_history begins");  // TODO: remove this line

        const parts = current_path.split('/').filter(part => part.length > 0);
        document.title = parts[parts.length - 1];

        if (current_path === this.spiRootPath) { // remove current history state and replace current path with the new one
            window.history.replaceState({}, '', dataSourcePath);
        }
        else {
            window.history.pushState({}, '', dataSourcePath);
        }

        console.log("Router _update_history ends");  // TODO: remove this line
    }

}


function removeTrailingSlash(path) {
    return path.replace(/\/$/, '');
}
