const networks = [
    {
        name: "localhost",
        chainId: 1337,
    },
    {
        name: "rinkeby",
        chainId: 4,
    },
    {
        name: "rinkeby-fork",
        chainId: 4,
    },
    {
        name: "goerli",
        chainId: 5,
    },
    {
        name: "test",
        chainId: 1,
    },
    {
        name: "coverage",
        chainId: 1,
    },
    {
        name: "mainnet",
        chainId: 1,
    },
    {
        name: "harmony",
        chainId: 1666600000,
    },
    {
        name: "harmonytest",
        chainId: 1666700000,
    },
];

export const getNetworkDetails = (name) => {
    return networks.find((n) => n.name === name);
};
