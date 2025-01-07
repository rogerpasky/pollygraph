import { Controller } from './controller.js';


export class Searcher {
    constructor(controller, searchInputId, searchSuggestionsId) {
        this._controller = controller;
        this._input = document.getElementById(searchInputId);
        if (this._input) {
            this._suggestions = document.getElementById(searchSuggestionsId);
            this._caseSensitive = false;

            this._input.addEventListener('input', this._onInput.bind(this));
            this._keyModifierStatus = {"Shift": false, "Alt": false, "Control": false, "Meta": false, "CapsLock": false};
            document.addEventListener('keydown', this._onKeydown.bind(this));
            document.addEventListener('keyup', this._onKeyup.bind(this));
        }
    }

    _search(query) {
        const result = this._controller.search(query, 20);
        return result;
    }

    _onInput() {
        const searchTerm = this._input.value;
        const filteredData = this._search(searchTerm, 10, this._caseSensitive);

        this._suggestions.innerHTML = '';
        if (! filteredData ||  filteredData.nodeLabels.length === 0) {
            this._suggestions.style.display = 'none';
            return;
        }

        this._suggestions.style.display = 'block';
        filteredData.nodeLabels.forEach(suggestion => {
            const [id, label] = suggestion;
            const li = document.createElement('li');
            this._setUpLiElement(li, id, searchTerm, label);
            this._suggestions.appendChild(li);
        });
    }

    _setUpLiElement(li, id, searchTerm, label) {
        li.setAttribute('tabindex', '0');
        li.innerHTML = label.replace(new RegExp(searchTerm, 'gi'), match => `<strong>${match}</strong>`);
        li.addEventListener('click', () => this._focusOnId(label, id));
        li.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this._focusOnId(label, id);
            }
        });
    }

    _focusOnId(label, id) {
        this._input.value = label;
        this._suggestions.style.display = 'none';
        this._controller.onFocusChange(id);
    }

    _onKeydown(event) {
        if (this._keyModifierStatus['Control'] && event.key === 'f') {
            this._input.focus();
        }
        else if (event.key in this._keyModifierStatus) {
            this._keyModifierStatus[event.key] = true;
        }
    }

    _onKeyup(event) {
        if (event.key in this._keyModifierStatus) {
            this._keyModifierStatus[event.key] = false;
        }
        else if (event.key === 'Escape') {
            this._input.value = '';
            this._suggestions.style.display = 'none';
        }
    }
}
