const axios = require("axios");
const fs = require("fs");
const { argv } = require("process");

const refreshOpenseaMetadata = async (id) => {
    const reqUrl = `https://api.opensea.io/api/v1/asset/0x288B265ccB133e24a6fE9BAff6Ab0e5C27afd40b/${id}?force_update=true`;
    console.log("Requesting refresh from: " + reqUrl);
    const headers = {
        "Content-Type": "application/json",
        "X-API-KEY": "68426d83e2a24abbab0f20fc8a6cfc6a",
    };
    const res = await axios.get(reqUrl, headers);
    console.log({ status: res.status, data: res.toJson() });
};

console.log("Refreshing metadata for files in directory: " + argv[2]);

const files = fs.readdirSync(argv[2]);

for (const f of files) {
    refreshOpenseaMetadata(f.split(".")[0]);
}
