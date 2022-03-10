const log = console.log;
import fs from "fs";
import path from "path";

import { getNetworkDetails } from "../utils/networks";

import hardHatContractImports from "../utils/hardhat-utill";

const transferOwnershipTask = async (opts) => {
    let res;
    switch (opts.network) {
        case "matic":
            opts.contractConfigs = require("../minty-deployment-matic.json");
            opts.hardHatImports = hardHatContractImports(
                opts.contractConfigscontractConfigs
            );
            res = await transferOwnership(opts);
            break;
        case "mumbai":
            opts.contractConfigs = require("../minty-deployment-mumbai.json");
            opts.hardHatImports = hardHatContractImports(
                opts.contractConfigscontractConfigs
            );
            res = await transferOwnership(opts);
            break;
        case "test":
        case "coverage":
            opts.contractConfigs = require("../minty-deployment.json");
            opts.hardHatImports = hardHatContractImports(
                opts.contractConfigscontractConfigs
            );
            res = await transferOwnership(opts);
            break;
        case "hardhat":
            opts.contractConfigs = require("../minty-deployment.json");
            opts.hardHatImports = hardHatContractImports(
                opts.contractConfigscontractConfigs
            );
            res = await transferOwnership(opts);
            break;
        default:
            throw new Error(`Unsupported operation ${opts.network}`);
    }
    return res;
};

const asyncFunc = async (
    deployment,
    { contractConfigs, network, hardHatImports }
) => {
    return {};
};

const getEnvVar = (name) => {
    if (!process.env[name]) throw Error(`Missing env var: ${name}`);
    return process.env[name];
};

const getOptionalEnvVar = (name, defaultValue) => {
    const envVar = process.env[name];
    return envVar ? envVar : defaultValue;
};
