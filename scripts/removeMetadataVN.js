const fs = require("fs");

const setImage = async (file, dir) => {
    const filePath = `${dir}/${file}`;
    const data = require(filePath);
    for (const item of data.attributes) {
        console.log(item);
        item.value = item.value.split(" ").slice(1).join(" ");
    }
    try {
        fs.writeFileSync(filePath, JSON.stringify(data));
    } catch (err) {
        console.log(err);
    }
    console.log("Wrote to: " + filePath);
};

const writeMetadata = async (dir) => {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        setImage(f, dir);
    }
};

writeMetadata("/home/alpin/AlpineLines/equa/metadata");
