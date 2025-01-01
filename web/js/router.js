export class Router {
    constructor(spiRootPath, datasourceRootPath, getTitle=_defaultGetTitle) {
        this.spiRootPath = _removeTrailingSlash(spiRootPath);
        this.datasourceRootPath = _removeTrailingSlash(datasourceRootPath);
        this.getTitle = getTitle;
        this.onUrlChangeCallback = null;
    }

    init(onUrlChangeCallback, datasourceInitialContent) {
        this.onUrlChangeCallback = onUrlChangeCallback
        this._listenToBackAndForward();

        const currentPath = _getCurrentCleanUrl();
        if (currentPath === this.spiRootPath) {
            this.onUrlChangeCallback(datasourceInitialContent);
        }
        else {
            this.onHistoryChange({ state: { path: currentPath } });
        }
    }

    onHistoryChange(event) {
        const changedPath = event.state ? event.state.path : _getCurrentCleanUrl();

        if (! changedPath.startsWith(this.spiRootPath)) {
            return;
        }

        const datasource = this.datasourceRootPath + changedPath.replace(this.spiRootPath, '');
        const focusedNodeId = _getCurrentCleanHash();
        this.onUrlChangeCallback(datasource, focusedNodeId, true);  // TODO: handle the case when datasource didn't chage but focusedNodeId did
    }

    route(dataSourcePath, focusedNodeId, fromRouter=false) {
        if (!dataSourcePath.startsWith(this.datasourceRootPath)) {  // TODO: handle the case when dataSourcePath is a relative path or an absolute path that does not start with this.spiRootPath
            console.error(`The dataSourcePath "${dataSourcePath}" is not a valid path`);
        }

        if (fromRouter) {
            return;
        }

        const currentPath = _getCurrentCleanUrl();
        const currentRoute = `${currentPath}#${_getCurrentCleanHash()}`;

        const newPath = dataSourcePath.replace(this.datasourceRootPath, this.spiRootPath)
        const newRoute = newPath + (focusedNodeId ? `#${focusedNodeId}` : '');
                
        if (currentPath !== this.spiRootPath && currentRoute !== newRoute) {
            window.history.pushState({ path: currentRoute }, '', currentRoute);
        }
        window.history.replaceState({ path: newRoute }, '', newRoute);
        document.title = this.getTitle(newPath, focusedNodeId);
    }
                
    _listenToBackAndForward() {
        window.addEventListener('popstate', this.onHistoryChange.bind(this));
    }
}


function _getCurrentCleanUrl() {
    return _removeTrailingSlash(window.location.pathname);
}


function _getCurrentCleanHash() {
    return window.location.hash.replace(/^#/, '');
}


function _removeTrailingSlash(path) {
    return path.replace(/\/$/, '');
}

function _defaultGetTitle(path, hash) {
    const parts = path.split('/').filter(part => part.length > 0);
    return `${parts[parts.length - 1]} - ${hash}`;
}