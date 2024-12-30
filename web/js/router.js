export class Router {
    constructor(spiRootPath, datasourceRootPath) {
        this.spiRootPath = _removeTrailingSlash(spiRootPath);
        this.datasourceRootPath = _removeTrailingSlash(datasourceRootPath);
        this.onUrlChangeCallback = null;
        this.reactingToHistoryChange = false;
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
        if (changedPath.startsWith(this.spiRootPath)) {
            const datasource = this.datasourceRootPath + changedPath.replace(this.spiRootPath, '');
            this.reactingToHistoryChange = true;
            this.onUrlChangeCallback(datasource);
        }
    }

    route(dataSourcePath) {
        if (!dataSourcePath.startsWith(this.datasourceRootPath)) {  // TODO: handle the case when dataSourcePath is a relative path or an absolute path that does not start with this.spiRootPath
            console.error(`The dataSourcePath "${dataSourcePath}" is not a valid path`);
        }

        if (this.reactingToHistoryChange) {
            this.reactingToHistoryChange = false;
            return;
        }

        const urlToStore = dataSourcePath.replace(this.datasourceRootPath, this.spiRootPath);
        const currentPath = _getCurrentCleanUrl();
        const parts = currentPath.split('/').filter(part => part.length > 0);
        document.title = parts[parts.length - 1];
        
        if (currentPath === this.spiRootPath) {
            window.history.replaceState({ path: urlToStore }, '', urlToStore);
        }
        else {
            window.history.pushState({ path: urlToStore }, '', urlToStore);
        }
    }
                
    _listenToBackAndForward() {
        window.addEventListener('popstate', this.onHistoryChange.bind(this));
    }
}


function _getCurrentCleanUrl() {
    return _removeTrailingSlash(window.location.pathname);
}


function _removeTrailingSlash(path) {
    return path.replace(/\/$/, '');
}
