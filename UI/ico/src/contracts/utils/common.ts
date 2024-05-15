export type AddressType = {
    97: string;
    56: string;
}

export enum CHAIN_ID {
    TESTNET = 97,
    MAINET = 56,
}

export default function getChainIdFromEnv() : number {
    const env = process.env.NEXT_PUBLIC_CHAIN_ID;
    if (!env) { return 97; }
    return parseInt(env);
}

export const getRPC = () => {
    if(getChainIdFromEnv() === CHAIN_ID.MAINET)
        return process.env.NEXT_PUBLIC_RPC_MAINNET;
    return process.env.NEXT_PUBLIC_RPC_TESTNET;
}

export const SMART_ADDRESS = {
    CROWD_SALE: {97: '0x5bF0Ddd1949583384B8151e1E7AD680e8D0747a2', 56: ''},
    USDT: {97: '0x34D138D8dc64C15848B257705D93bBc69503bE13', 56: ''},
}