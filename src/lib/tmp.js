const setImage = async (file, uri) => {
    const filePath = `${metadataDir}/${file}`;
    const data = await fs.readFileSync(filePath);
    const parsedData = JSON.parse(data);
    parsedData.imagde = uri;
    await fs.writeFileSync(filePath, JSON.stringify(parsedData));
};

const writeMetadata = async (dir, cid) => {
    await fs.readdir(dir, (err, files) => {
        if (err) {
            console.error(err);
        }
        files.forEach((f) => {
            const tokenImageURI = `ipfs://${cid}/${f}`;
            setImage(f, tokenImageURI);
        });
    });
};

const uploadIpfs = async (dir) => {
    spawn("ipfs", [`add`, `-r`, dir], {
        stdio: "inherit",
    });
};

const mint = async (ownerAddress, metadataDir) => {
    let _ids = [];
    const files = await fs.readdir(metadataDir);
    files.forEach(async (f) => {
        const tokenMetadataURI = `${mdCid}/${f}`;
        // console.log({ tokenMetadataURI });
        const id = await this.contract.mintToken(tokenMetadataURI);
        console.log({ id });
        _ids.push(id);
    });
    return _ids;
};

writeMetadata(metadataDir, imgCid);

uploadIpfs(imageDir);

uploadIpfs(metadataDir);

const ids = await mint(this.defaultOwnerAddress, metadataDir);
