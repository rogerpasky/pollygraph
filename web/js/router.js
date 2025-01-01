export class Router {
    constructor(spiRootPath, datasourceRootPath, getTitleFunction=_defaultGetTitleFunction) {
        this.spiRootPath = _removeTrailingSlash(spiRootPath);
        this.datasourceRootPath = _removeTrailingSlash(datasourceRootPath);
        this.getTitle = getTitleFunction;
        this.onUrlChangeCallback = null;
    }

    init(onUrlChangeCallback, datasourceInitialContent) {
        this.onUrlChangeCallback = onUrlChangeCallback
        this._listenToBackAndForward();

        const currentPath = _getCurrentCleanPath();
        if (currentPath === this.spiRootPath) {
            this.onUrlChangeCallback(datasourceInitialContent);
        }
        else {
            this._onHistoryChange();
        }
    }

    route(dataSourcePath, focusedElementId, fromRouter=false) {
        if (fromRouter) {
            return;
        }

        if (! dataSourcePath.startsWith(this.datasourceRootPath) || dataSourcePath.startsWith('./')) {
            throw new Error(`The dataSourcePath "${dataSourcePath}" is not a valid path`);
        }

        const currentPath = _getCurrentCleanPath();
        const currentRoute = `${currentPath}#${_getCurrentCleanHash()}`;

        const newPath = dataSourcePath.replace(this.datasourceRootPath, this.spiRootPath)
        const newRoute = newPath + (focusedElementId ? `#${focusedElementId}` : '');
                
        if (currentPath !== this.spiRootPath && currentRoute !== newRoute) {
            window.history.pushState({}, '', currentRoute);
        }
        window.history.replaceState({}, '', newRoute);
        document.title = this.getTitle(newPath, focusedElementId);
    }

    _listenToBackAndForward() {
        window.addEventListener('popstate', this._onHistoryChange.bind(this));
    }

    _onHistoryChange() {
        const changedPath = _getCurrentCleanPath();
        if (! changedPath.startsWith(this.spiRootPath)) {
            return;
        }

        const datasourcePath = this.datasourceRootPath + changedPath.replace(this.spiRootPath, '');
        const focusedElementId = _getCurrentCleanHash();
        this.onUrlChangeCallback(datasourcePath, focusedElementId, true);
    }
}


function _getCurrentCleanPath() {
    return _removeTrailingSlash(window.location.pathname);
}


function _getCurrentCleanHash() {
    return window.location.hash.replace(/^#/, '');
}


function _removeTrailingSlash(path) {
    return path.replace(/\/$/, '');
}


function _defaultGetTitleFunction(path, hash) {
    const parts = path.split('/').filter(part => part.length > 0);
    return `${parts[parts.length - 1]} - ${hash}`;
}
