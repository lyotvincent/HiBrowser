let annotation = {
    type: "annotation",
    displayMode: "expanded",
    height: 300,
    colorBy: "biotype",
    colorTable: {
       "antisense": "blueviolet",
       "protein_coding": "blue",
       "retained_intron": "rgb(0, 150, 150)",
       "processed_transcript": "purple",
       "processed_pseudogene": "#7fff00",
       "unprocessed_pseudogene": "#d2691e",
       "*": "black"
    }
};
let wig = {
    type: "wig"
};
let alignment = {
    type: "alignment"
};
let variant = {  
    type: "variant",
    squishedCallHeight: 1,
    expandedCallHeight: 4,
    displayMode: "squished"
};
let seg = {
    type: "seg",
    format: "seg",
    indexed: false,
    isLog: true
};
let interact={
    "type": "interaction",
    "format": "bedpe",
 };
let junction={
    type: 'junction',
    thicknessBasedOn: 'numUniqueReads', //options: numUniqueReads (default), numReads, isAnnotatedJunction
    bounceHeightBasedOn: 'random', //options: random (default), distance, thickness
    colorBy: 'isAnnotatedJunction', //options: numUniqueReads (default), numReads, isAnnotatedJunction, strand, motif
    labelUniqueReadCount: true,
    labelMultiMappedReadCount: true,
    labelTotalReadCount: false,
    labelMotif: false,
    labelAnnotatedJunction: " [A]"
};
let gwas = {
    type: "gwas",
    indexed: false,
    format: "gwas"
 }

export var track_config = new Map();
track_config.set("annotation", annotation);
track_config.set("wig", wig);
track_config.set("alignment", alignment);
track_config.set("variant", variant);
track_config.set("seg", seg);
track_config.set("interact", interact);
track_config.set("junction", junction);
track_config.set("gwas", gwas);
