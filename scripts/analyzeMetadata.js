const fs = require("fs");
const _ = require("underscore");

const getArrays = async () => {
    let img = [];
    let md = [];
    let imgDiff = false;
    let mdDiff = false;

    const imgFiles = fs.readdirSync("/home/alpin/AlpineLines/equa/images/");
    imgFiles.forEach((f) => {
        if (f.split(".")[1] !== "png") {
            imgDiff = true;
        } else {
            imgDiff = false;
        }
        const i = f.split(".")[0];
        if (i.includes(" ")) {
            console.log(i, "IMG");
        }
        img.push(i);
    });

    const mdFiles = fs.readdirSync("/home/alpin/AlpineLines/equa/metadata/");
    mdFiles.forEach((f) => {
        if (f.split(".")[1] !== "json") {
            mdDiff = true;
        } else {
            mdDiff = false;
        }
        const i = f.split(".")[0];
        if (i.includes(" ")) {
            console.log(i, "JSON");
        }
        md.push(i);
    });

    // console.log({ img });
    // console.log({ md });
    return { img, imgDiff, md, mdDiff };
};

const main = async () => {
    const total = Array(11000);
    const { img, imgDiff, md, mdDiff } = await getArrays();

    var idDifference = _.difference(img, md);
    var missing = _.difference(img, total);

    console.log({
        imgDiff,
        allPng: img ? img.length : 0,
        mdDiff,
        allJson: md ? md.length : 0,
        idDifference,
        missing,
    });
    // console.log({ difference, missing });
};

main();
