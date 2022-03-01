const fs = require("fs");

const setImage = async (file, dir, uri) => {
    const filePath = `${dir}/${file}`;
    const data = fs.readFileSync(filePath);
    const parsedData = JSON.parse(data);
    parsedData.image = uri;
    parsedData.external_url = "https://www.equa.global/nft-drop/";
    parsedData.seller_fee_basis_points = 250;
    parsedData.fee_recipient = "0xCaEa833339a610e3591D107bb746Ad18B474089f";
    console.log(parsedData);
    fs.writeFileSync(filePath, JSON.stringify(parsedData));
    console.log("Wrote image: " + uri + " to " + filePath);
};

const writeMetadata = async (dir, cid) => {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const imageURI = `ipfs://${cid}/${f.split(".")[0]}.png`;
        setImage(f, dir, imageURI);
    }
};

writeMetadata(
    "/home/alpin/AlpineLines/equa/equabotzMetadata-1/",
    "QmUR6yhJsi5RNkhKmLdw4GVVSjure46gDoskDfAwcqGUKH"
);
