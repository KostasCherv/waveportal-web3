const main = async () => {
  const [deployer] = await hre.ethers.getSigners();
  const accountBalance = await deployer.getBalance();

  console.log("Deploying contracts with account: ", deployer.address);
  console.log("Account balance: ", accountBalance.toString());

  const waveContractFactory = await hre.ethers.getContractFactory("WavePortal");
  const waveContract = await waveContractFactory.deploy({
    value: hre.ethers.utils.parseEther('0.001')
  });
  await waveContract.deployed();

  console.log("WavePortal address: ", waveContract.address);

  // update client files
  require('fs').copyFileSync('.\\artifacts\\contracts\\WavePortal.sol\\WavePortal.json', "..\\client\\src\\utils\\WavePortal.json")
  const wavePortalAddress = {
	  "contractAddress": waveContract.address
  }
  require('fs').writeFileSync('..\\client\\src\\utils\\wavePortalAddress.json', JSON.stringify(wavePortalAddress, null, 2));
};


const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();