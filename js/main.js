import { Model } from './model.js';
import { View } from './view.js';
import { Controller } from './controller.js';

import { countries } from './countries.js';


const model = new Model();
const view = new View();
const controler = new Controller(model, view);


export function traverseGraph(dataSource = null) {
    model.setDataSource(dataSource);
    controler.init();
}


function processCountries(countries) {
    const regions = ["Asia", "Europe", "Africa", "Americas", "Oceania", "Antarctic"];
    const nodes = countries.map(country => {
        return {id: country.cca3, label: country.name.common, group: regions.indexOf(country.region)};
    });
    const links = [];
    for (const country of countries) {
        const borders = country.borders;
        for (const border of borders) {
            if (links.find(l => l.source === border && l.target === country.cca3)) {
                continue;
            }
            links.push({source: country.cca3, target: border, value: 1});
        }
    }
    return {nodes, links};
}

model.setDataSource(processCountries(countries));
