export class Informer {
    constructor(elementId) {
        this._infoDiv = document.getElementById(elementId);
        this._infoDiv.setAttribute('tabindex', '0');

        this._keyModifierStatus = {"Shift": false, "Alt": false, "Control": false, "Meta": false, "CapsLock": false};
        document.addEventListener('keydown', this._onKeydown.bind(this));
        document.addEventListener('keyup', this._onKeyup.bind(this));
}

    onInfoChange(innerHTML) {
        this._infoDiv.innerHTML = innerHTML;
    }

    _onKeydown(event) {
        if (this._keyModifierStatus['Control'] && event.key === 'i') {
            this._infoDiv.focus();
        }
        else if (event.key in this._keyModifierStatus) {
            this._keyModifierStatus[event.key] = true;
        }
    }

    _onKeyup(event) {
        if (event.key in this._keyModifierStatus) {
            this._keyModifierStatus[event.key] = false;
        }
    }
}