import React, { useEffect, useState } from "react";
import "./output.css";
import "./App.css";
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";
import wavePortalAddress from './utils/WavePortalAddress';
import Modal from "react-modal";
import TransactionLoader from "./components/TransactionLoader";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Box from "@mui/material/Box";

const contractABI = abi.abi;
const contractAddress = wavePortalAddress.contractAddress

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#0a0b0d",
    padding: 0,
    border: "none",
  },
  overlay: {
    backgroundColor: "rgba(10, 11, 13, 0.75)",
  },
};

const App = () => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [wavesCounts, setWavesCounts] = useState([]);
  const [totalWaves, setTotalWaves] = useState(null);
  const [allWaves, setAllWaves] = useState([]);
  const [msg, setMsg] = useState("");

  const [loading, setIsLoading] = useState(false);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
        setCurrentAccount(null);
      }
    } catch (error) {
      console.log(error);
      setCurrentAccount(null);
    }
  };

  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        /*
         * Execute the actual wave from your smart contract
         */
        setIsLoading(true);
        const waveTxn = await wavePortalContract.wave(msg, {gasLimit: 3000000});
        console.log("Mining...", waveTxn.hash);

        const receipt = await waveTxn.wait();
        const data = receipt.logs[0].data
        const decoded = ethers.utils.defaultAbiCoder.decode(
            ['uint256', 'bool'], data
          )
        console.log(decoded[1])
        console.log("Mined -- ", waveTxn.hash);
        setMsg("")
        setIsLoading(false);
        await getTotalWaves();
        await getAllWaves();
        if (decoded[1]) {
          const prizeAmount = parseFloat(await wavePortalContract.getPrizeAmount()) / 1000000000000000000
          alert("You Won!" + prizeAmount + "ETH!")
        }
      } else {
        console.log(`Ethereum object doesn't exist!`);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getTotalWaves = async () => {
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setTotalWaves(parseInt(count));
      } else {
        console.log(`Ethereum object doesn't exist!`);
      }
    } catch (error) {
      console.log(error);
    }
  };



  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let"s
         * pick those out
         */
        let wavesCleaned = [];
   
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
            won: wave.won
          });
        });

        // count number of waves per address
        let wavesCount = {};
        wavesCleaned.forEach(wave => {
          if (wavesCount[wave.address]) {
            wavesCount[wave.address]++;
          } else {
            wavesCount[wave.address] = 1;
          }
        });

        // sort waves cleaned by timestamp desc
        wavesCleaned.sort((a, b) => {
          return b.timestamp - a.timestamp;
        });

        wavesCount = Object.keys(wavesCount).map(key => ({
          address: key,
          count: wavesCount[key]
        }));
        console.log(wavesCount)

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
        setWavesCounts(wavesCount);
      } else {
        console.log(`Ethereum object doesn't exist!`);
      }
    } catch (error) {
      console.log(error);
    }
  }

  window.ethereum.on("accountsChanged", checkIfWalletIsConnected);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [currentAccount]);

  useEffect(() => {
    getTotalWaves();
    getAllWaves();
  }, []);

  useEffect(
    () => () => {
      console.warning("unmount");
      window.ethereum.removeListener(
        "accountsChanged",
        checkIfWalletIsConnected
      );
    },
    []
  );

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      getTotalWaves();
      getAllWaves();
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  return (
    <div className="mainContainer" id="container">
      <div className="dataContainer">
        <div className="header">👋 Hey there!</div>

        <div className="bio">
          <p>I am a Backend Engineer playing with Web3. </p>
          <p>Connect your Ethereum wallet and wave at me!</p>
        </div>

        
        {currentAccount && (<div className="waveButton flex">
          <div>
            <input type="text" name="msg" id="msg" style={{border: "1px solid"}} value={msg} onChange={(e) => setMsg(e.target.value)}/>
          </div>
          <div style={{textAlign: 'center', width:'100%'}}>
            <button onClick={wave}> Wave and Win ETH!</button>
          </div>
        </div>)}

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {(wavesCounts.length > 0) && (
          <Box
            sx={{
              width: "100%",
              maxWidth: 600,
              bgcolor: "background.paper",
              textAlign: "center",
              border: "1px solid",
              borderRadius: "5px",
              marginTop: 5,
            }}
          >
            <h2>Total Waves: {totalWaves}</h2>
            <List>
              {wavesCounts.map((w) => {
                return (
                  <ListItem key={w.address}>
                    {w.address}: {w.count}
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
        {allWaves.map((wave, index) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: wave.won ? "lightgreen" : "antiquewhite",
                marginTop: "16px",
                padding: "8px",
              }}
            >
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={loading} style={customStyles} ariaHideApp={false}>
        <TransactionLoader />
      </Modal>
    </div>
  );
};

export default App;
