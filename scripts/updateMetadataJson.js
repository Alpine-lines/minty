const fs = require("fs");

const setMetadata = async (
    file,
    dir,
    uri,
    externalUrl,
    sellerFee,
    feeRecipient
) => {
    const filePath = `${dir}/${file}`;
    const data = fs.readFileSync(filePath);
    const parsedData = JSON.parse(data);
    parsedData.image = uri;
    if (externalUrl) {
        parsedData.external_url = externalUrl;
    }
    if (sellerFee) {
        parsedData.seller_fee_basis_points = sellerFee;
    }
    if (feeRecipient) {
        parsedData.fee_recipient = feeRecipient;
    }
    console.log(parsedData);
    fs.writeFileSync(filePath, JSON.stringify(parsedData));
    console.log("Wrote image: " + uri + " to " + filePath);
};

const writeMetadata = async (
    dir,
    cid,
    externalUrl,
    sellerFee,
    feeRecipient
) => {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const imageURI = `ipfs://${cid}/${f.split(".")[0]}.png`;
        setMetadata(f, dir, imageURI, externalUrl, sellerFee, feeRecipient);
    }
};

writeMetadata(
    argv[2], // dir
    argv[3], // cid
    argv[4], // external_url
    argv[5], // seller_fee_basis_points
    argv[6] // fee_recipient
);
