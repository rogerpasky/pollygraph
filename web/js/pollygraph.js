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
      const li = document.createElement('li');
      const a = document.createElement('a');
        a.href = suggestion[0];
        a.textContent = suggestion[1];
        li.appendChild(a);
        li.addEventListener('click', () => {
          searchInput.value = suggestion[1];
          suggestions.style.display = 'none';
          const elementId = suggestion[0].split('#')[1];
          controller.setDataFromSource(suggestion[0], elementId);
        });
        suggestions.appendChild(li);
    });
  } else {
    suggestions.style.display = 'none';
  }
});
