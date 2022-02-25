const fs = require("fs/promises");

const setImage = async (file, dir, uri) => {
    const filePath = `${dir}/${file}`;
    const data = await fs.readFile(filePath);
    const parsedData = JSON.parse(data);
    parsedData.image = uri;
    await fs.writeFile(filePath, JSON.stringify(parsedData));
    console.log("Wrote image: " + uri + " to " + filePath);
};

const writeMetadata = async (dir, cid) => {
    const files = await fs.readdir(dir);
    files.forEach((f) => {
        const imageURI = `ipfs://${cid}/${f}`;
        setImage(f, dir, imageURI);
    });
};

writeMetadata(
    "/home/alpin/AlpineLines/equa/md/",
    "QmUUZKLzZkuJnVXny8FHreNoEzH2SQtTDNLvianS6n3VpF"
);
