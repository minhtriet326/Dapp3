import { ethers, hardhatArguments, network } from 'hardhat';
import * as Config from './config';

async function main() {
    await Config.initConfig();
    const network = hardhatArguments.network ? hardhatArguments.network : "dev";
    const [deployer] = await ethers.getSigners();
    console.log("Deploy from address: ", deployer.address);

    // const Floppy = await ethers.getContractFactory("USDT");
    // const floppy = await Floppy.deploy();
    // console.log("USDT address: ", floppy.address);
    // Config.setConfig(network + '.USDT', floppy.address);

    const Ico = await ethers.getContractFactory("FLPCrowndsale");
    const ico = await Ico.deploy(1000, 100, "0x6892FB2ee8BCcE751257803db3a0E5D40Dd2ACC2", "0xE36669D6347F62c0F22d23b7bAD5af18F5d6423c");
    console.log("Ico address: ", ico.address);
    Config.setConfig(network + '.ico', ico.address);

    await Config.updateConfig();
}

main().then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1)
    });