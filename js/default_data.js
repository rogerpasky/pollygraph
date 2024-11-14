export const data = {
    nodes: [
        {id: "Myriel", group: 1},
        {id: "Napoleon", group: 1},
        {id: "Mlle.Baptistine", group: 1},
        {id: "Mme.Magloire", group: 1},
        {id: "CountessdeLo", group: 1},
        {id: "Geborand", group: 1},
        {id: "Champtercier", group: 1},
        {id: "Cravatte", group: 1},
        {id: "Count", group: 1},
        {id: "OldMan", group: 1},
        {id: "Labarre", group: 2},
        {id: "Valjean", group: 2},
        {id: "Marguerite", group: 3},
        {id: "Mme.deR", group: 2},
        {id: "Isabeau", group: 2},
        {id: "Gervais", group: 2},
        {id: "Tholomyes", group: 3},
        {id: "Listolier", group: 3},
        {id: "Fameuil", group: 3},
        {id: "Blacheville", group: 3},
        {id: "Favourite", group: 3},
        {id: "Dahlia", group: 3}
    ],
    links: [
        {source: "Napoleon", target: "Myriel", size: 1},
        {source: "Mlle.Baptistine", target: "Myriel", size: 8},
        {source: "Mme.Magloire", target: "Myriel", size: 10},
        {source: "Mme.Magloire", target: "Mlle.Baptistine", size: 6},
        {source: "CountessdeLo", target: "Myriel", size: 1},
        {source: "Geborand", target: "Myriel", size: 1},
        {source: "Champtercier", target: "Myriel", size: 1},
        {source: "Cravatte", target: "Myriel", size: 1},
        {source: "Count", target: "Myriel", size: 2},
        {source: "OldMan", target: "Myriel", size: 1},
        {source: "Valjean", target: "Labarre", size: 1},
        {source: "Valjean", target: "Mme.Magloire", size: 3},
        {source: "Valjean", target: "Mlle.Baptistine", size: 3},
        {source: "Valjean", target: "Myriel", size: 5},
        {source: "Marguerite", target: "Valjean", size: 1},
        {source: "Mme.deR", target: "Valjean", size: 1},
        {source: "Isabeau", target: "Valjean", size: 1},
        {source: "Gervais", target: "Valjean", size: 1},
        {source: "Listolier", target: "Tholomyes", size: 4},
        {source: "Fameuil", target: "Tholomyes", size: 4},
        {source: "Fameuil", target: "Listolier", size: 4},
        {source: "Blacheville", target: "Tholomyes", size: 4},
        {source: "Blacheville", target: "Listolier", size: 4},
        {source: "Blacheville", target: "Fameuil", size: 4},
        {source: "Favourite", target: "Tholomyes", size: 3},
        {source: "Favourite", target: "Listolier", size: 3},
        {source: "Favourite", target: "Fameuil", size: 3},
        {source: "Favourite", target: "Blacheville", size: 4},
        {source: "Dahlia", target: "Tholomyes", size: 3},
        {source: "Dahlia", target: "Listolier", size: 3},
        {source: "Dahlia", target: "Fameuil", size: 3},
        {source: "Dahlia", target: "Blacheville", size: 3},
        {source: "Dahlia", target: "Favourite", size: 5}
    ]
};
