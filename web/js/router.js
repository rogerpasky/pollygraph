export class Router {
    constructor(spiRootPath, datasourceRootPath, getTitleFunction=_defaultGetTitleFunction) {
        this._spiRootPath = _removeTrailingSlash(spiRootPath);
        this._datasourceRootPath = _removeTrailingSlash(datasourceRootPath);
        this._getTitle = getTitleFunction;
        this._onUrlChangeCallback = null;
    }

    init(onUrlChangeCallback, datasourceInitialContent) {
        this._onUrlChangeCallback = onUrlChangeCallback
        this._listenToBackAndForward();

        const currentPath = _getCurrentCleanPath();
        if (currentPath === this._spiRootPath) {
            this._onUrlChangeCallback(datasourceInitialContent);
        }
        else {
            this._onHistoryChange();
        }
    }

    route(dataSourcePath, focusedElementId, fromRouter=false) {
        if (fromRouter) {
            return;
        }

        if (! dataSourcePath.startsWith(this._datasourceRootPath) || dataSourcePath.startsWith('./')) {
            throw new Error(`The dataSourcePath "${dataSourcePath}" is not a valid path`);
        }

        const currentPath = _getCurrentCleanPath();
        const currentRoute = currentPath + window.location.hash;

        const newPath = dataSourcePath.replace(this._datasourceRootPath, this._spiRootPath)
        const newRoute = newPath + (focusedElementId ? `#${focusedElementId}` : '');
                
        if (currentPath !== this._spiRootPath && currentRoute !== newRoute) {
            window.history.pushState({}, '', currentRoute);
        }
        window.history.replaceState({}, '', newRoute);
        document.title = this._getTitle(newPath, focusedElementId);
    }

    _listenToBackAndForward() {
        window.addEventListener('popstate', this._onHistoryChange.bind(this));
    }

    _onHistoryChange() {
        const changedPath = _getCurrentCleanPath();
        if (! changedPath.startsWith(this._spiRootPath)) {
            return;
        }

        const datasourcePath = this._datasourceRootPath + changedPath.replace(this._spiRootPath, '');
        const focusedElementId = _getCurrentCleanHash();
        this._onUrlChangeCallback(datasourcePath, focusedElementId, true);
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
