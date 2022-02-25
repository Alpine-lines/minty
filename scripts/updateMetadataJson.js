const fs = require("fs/promises");

const setImage = async (file, dir, uri) => {
    const filePath = `${dir}/${file}`;
    const data = await fs.readFile(filePath);
    const parsedData = JSON.parse(data);
    parsedData.image = uri;
    // parsedData.external_url = "https://www.equa.global/nft-drop/";
    // parsedData.seller_fee_basis_points = 250;
    // parsedData.fee_recipient = "0xCaEa833339a610e3591D107bb746Ad18B474089f";
    console.log(parsedData);
    await fs.writeFile(filePath, JSON.stringify(parsedData));
    console.log("Wrote image: " + uri + " to " + filePath);
};

const writeMetadata = async (dir, cid) => {
    const files = await fs.readdir(dir);
    for (const f of files) {
        const imageURI = `ipfs://${cid}/${f}`;
        setImage(f, dir, imageURI);
    }
};

writeMetadata(
    "/home/alpin/AlpineLines/equa/metadata/",
    "QmXXb4e2YjWziM1oExY9yDeYsAcEqKA8UW7pzbJmUVgebd"
);
