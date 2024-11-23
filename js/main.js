import { Model } from './model.js';
import { View } from './view.js';
import { Controller } from './controller.js';

import { countries } from './countries.js';


function directedEdgeTextFormatter(_fromText, toText) {
    return `to ${toText}`;
}


const model = new Model();
const view = new View(null, directedEdgeTextFormatter);
const controler = new Controller(model, view);


function processCountries(countries) {
    const regions = ["Asia", "Europe", "Africa", "Americas", "Oceania", "Antarctic"];
    const maxSize = countries.reduce((max, country) => Math.max(max, country.area), 0);
    const minSize = countries.reduce((min, country) => Math.min(min, country.area), maxSize);
    const nodes = countries.map(country => {
        return {id: country.cca3, type: regions.indexOf(country.region), size: (country.area - minSize) / (maxSize - minSize), label: country.name.common}; // bounded to [0, 1]
    });
    const edges = [];
    for (const country of countries) {
        const borders = country.borders;
        for (const border of borders) {
            if (edges.find(l => l.source === border && l.target === country.cca3)) {
                continue;
            }
            edges.push({source: country.cca3, target: border, value: 1});
        }
    }
    return {nodes, edges};
}

model.setDataSource(processCountries(countries));


const a = {
    "name":{
        "common":"Andorra",
        "official":"Principality of Andorra",
        "native":{
            "cat":{
                "official":"Principat d'Andorra",
                "common":"Andorra"
            }
        }
    },
    "tld":[".ad"],
    "cca2":"AD",
    "ccn3":"020",
    "cca3":"AND",
    "cioc":"AND",
    "independent":true,
    "status":"officially-assigned",
    "unMember":true,
    "currencies":{
        "EUR":{
            "name":"Euro",
            "symbol":"\u20ac"}
        },
        "idd":{
            "root":"+3",
            "suffixes":["76"]
        },
        "capital":["Andorra la Vella"],
        "altSpellings":["AD","Principality of Andorra","Principat d'Andorra"],
        "region":"Europe",
        "subregion":"Southern Europe",
        "languages":{"cat":"Catalan"},
        "translations":{"ces":{"official":"Andorrsk\u00e9 kn\u00ed\u017eectv\u00ed","common":"Andorra"},
        "deu":{"official":"F\u00fcrstentum Andorra","common":"Andorra"},
        "est":{"official":"Andorra V\u00fcrstiriik","common":"Andorra"},
        "fin":{"official":"Andorran ruhtinaskunta","common":"Andorra"},
        "fra":{"official":"Principaut\u00e9 d'Andorre","common":"Andorre"},
        "hrv":{"official":"Kne\u017eevina Andora","common":"Andora"},
        "hun":{"official":"Andorra","common":"Andorra"},
        "ita":{"official":"Principato di Andorra","common":"Andorra"},
        "jpn":{"official":"\u30a2\u30f3\u30c9\u30e9\u516c\u56fd","common":"\u30a2\u30f3\u30c9\u30e9"},
        "kor":{"official":"\uc548\ub3c4\ub77c \uacf5\uad6d","common":"\uc548\ub3c4\ub77c"},
        "nld":{"official":"Prinsdom Andorra","common":"Andorra"},
        "per":{"official":"\u0634\u0627\u0647\u0632\u0627\u062f\u0647\u200c\u0646\u0634\u06cc\u0646 \u0622\u0646\u062f\u0648\u0631\u0627","common":"\u0622\u0646\u062f\u0648\u0631\u0627"},
        "pol":{"official":"Ksi\u0119stwo Andory","common":"Andora"},
        "por":{"official":"Principado de Andorra","common":"Andorra"},
        "rus":{"official":"\u041a\u043d\u044f\u0436\u0435\u0441\u0442\u0432\u043e \u0410\u043d\u0434\u043e\u0440\u0440\u0430","common":"\u0410\u043d\u0434\u043e\u0440\u0440\u0430"},
        "slk":{"official":"Andorrsk\u00e9 knie\u017eatstvo","common":"Andorra"},
        "spa":{"official":"Principado de Andorra","common":"Andorra"},
        "swe":{"official":"Furstend\u00f6met Andorra","common":"Andorra"},
        "urd":{"official":"\u0627\u0645\u0627\u0631\u0627\u062a\u0650 \u0627\u0646\u0688\u0648\u0631\u0627","common":"\u0627\u0646\u0688\u0648\u0631\u0627"},
        "zho":{"official":"\u5b89\u9053\u5c14\u516c\u56fd","common":"\u5b89\u9053\u5c14"}
    },
    "latlng":[42.5,1.5],
    "landlocked":true,
    "borders":["FRA","ESP"],
    "area":468,
    "flag":"\ud83c\udde6\ud83c\udde9",
    "demonyms":{
        "eng":{"f":"Andorran","m":"Andorran"},
        "fra":{"f":"Andorrane","m":"Andorran"}
    },
    "callingCodes":["+376"],
};
