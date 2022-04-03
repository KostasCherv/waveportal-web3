const { expect } = require("chai");

describe("WavePortal contract", function () {
  let owner, randomPerson1, randomPerson2;
  let contract, chain;
  const initialcontactBalance = '0.1'
  const network = 'rinkeby' // use rinkeby testnet
  const provider = ethers.getDefaultProvider(network)

  const getDecoced = (receipt) => {
    const data = receipt.logs[0].data
    const decoded = ethers.utils.defaultAbiCoder.decode(
      ['uint256', 'bool'], data
    )

    return decoded
  }

  beforeEach(async function () {
    [owner, randomPerson1, randomPerson2] = await ethers.getSigners();
    contract = await ethers.getContractFactory("WavePortal");
    chain = await contract.deploy({
          value: hre.ethers.utils.parseEther(initialcontactBalance),
    });
    
  })

  it("should have 0 waves", async function () {
    expect(await chain.getTotalWaves()).to.equal(0);
  });

  it("should get the chance to win", async function () {
    const chanceToWin = await chain.getChanceToWin()
    expect(chanceToWin).to.not.be.undefined;
  });

  it("should not get the chance to win", async function () {
    try{
      await chain.connect(randomPerson1).getChanceToWin();
    }catch(error){
      expect(error.message).to.includes("Cant set chance to win if not owner");
    }
  });

  it("should change the chance to win", async function () {
    await chain.setChanceToWin(100);
    expect(await chain.getChanceToWin()).to.equal(100);
  });

  it("should not change the chance to win", async function () {
    try{
      await chain.connect(randomPerson1).setChanceToWin(100);
    }catch(error){
      expect(error.message).to.includes("Cant set chance to win if not owner");
    }
  });


   // get contract balance
  it("should get contract balance", async function () {
    let balance = await chain.getBalance()
    expect(balance).to.equal(hre.ethers.utils.parseEther(initialcontactBalance));
  })

   
  it("should check NewWave event data", async function () {
    let balance = await chain.getBalance()
    expect(balance).to.equal(hre.ethers.utils.parseEther(initialcontactBalance));

    await chain.setChanceToWin(100);
    const receipt1 = await chain.wave('Random')
    const [ts1, won1] = getDecoced(await receipt1.wait())
    expect(won1).to.equal(true);

    await chain.setChanceToWin(0);
    const receipt2 = await chain.connect(randomPerson1).wave('Random')
    const [ts2, won2] = getDecoced(await receipt2.wait())
    expect(won2).to.equal(false);
  })

  // should wave, win and reduce contract balance
  it("should wave and reduce contract balance", async function () {
    let balance = await chain.getBalance()
    expect(balance).to.equal(hre.ethers.utils.parseEther(initialcontactBalance));

    await chain.setChanceToWin(100);
    await chain.wave('Random')

    balance = await chain.getBalance()
    expect(balance).to.equal(hre.ethers.utils.parseEther('0.0999'));
  })

  // should wave and reduce contract balance
  it("should wave, not win and not reduce contract balance", async function () {
    let balance = await chain.getBalance()
    expect(balance).to.equal(hre.ethers.utils.parseEther(initialcontactBalance));

    await chain.setChanceToWin(0);
    const receipt = await chain.wave('Random')

    balance = await chain.getBalance()
    expect(balance).to.equal(hre.ethers.utils.parseEther('0.1'));
  })


  it("Wave and get back 1 total waves", async function () {
    await chain.wave('Random Test');
    expect(await chain.getTotalWaves()).to.equal(1);
  });

  it("Wave and get back 2 total waves", async function () {
    await chain.wave('Random Test');
    await chain.connect(randomPerson1).wave('Random Test');

    expect(await chain.getTotalWaves()).to.equal(2);
  });


  it("should get waves", async function () {
    expect(await chain.getAllWaves()).lengthOf(0)
    await chain.wave('Random Test');
    await chain.connect(randomPerson1).wave('Random Test');
    await chain.connect(randomPerson2).wave('Random Test');

    const waves = await chain.getAllWaves()
    expect(waves).lengthOf(3)
    expect(waves[0]).to.have.property('waver', owner.address)
    expect(waves[0]).to.have.property('message', 'Random Test')
    expect(waves[0]).to.have.property('timestamp')
    expect(waves[0]).to.have.property('won')

    expect(waves[1].waver).to.equal(randomPerson1.address)
    expect(waves[2].waver).to.equal(randomPerson2.address)

  });


   it("should have won", async function () {
    await chain.setChanceToWin(100);
    await chain.wave('Random Test');

    const waves = await chain.getAllWaves()
    expect(waves).lengthOf(1)
    expect(waves[0]).to.have.property('waver', owner.address)
    expect(waves[0]).to.have.property('message', 'Random Test')
    expect(waves[0]).to.have.property('timestamp')
    expect(waves[0]).to.have.property('won', true)
  });


});