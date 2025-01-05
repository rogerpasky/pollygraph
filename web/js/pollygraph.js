import { Model } from './model.js';
import { View } from './view.js';
import { Controller } from './controller.js';
import { Router } from './router.js';


const model = new Model();
const view = new View();
const controller = new Controller(model, view);


export function pollygraph(datasourceInitialContent, spiRootPath="", datasourceRootPath="") {  
    const router = datasourceRootPath != "" ? new Router(spiRootPath, datasourceRootPath) : null;
    controller.init(datasourceInitialContent, router);
}

export function search(query) {
    const result = controller.search(query, 10);
    return result;
}

const searchInput = document.getElementById('searchInput');
const suggestions = document.getElementById('suggestions');

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredData = search(searchTerm);

    suggestions.innerHTML = '';
    if (filteredData && filteredData.nodeLabels.length > 0) {
        suggestions.style.display = 'block';
        filteredData.nodeLabels.forEach(suggestion => {
            const [id, label] = suggestion;
            const li = document.createElement('li');
            li.innerHTML = label.replace(new RegExp(searchTerm, 'gi'), match => `<strong>${match}</strong>`);
            li.addEventListener('click', () => {
                searchInput.value = label;
                suggestions.style.display = 'none';
                controller.onFocusChange(id);
            });
            suggestions.appendChild(li);
        });
    } else {
        suggestions.style.display = 'none';
    }
});
