// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

struct Wave {
	address waver; // The address of the user who waved.
	string message; // The message the user sent.
	uint256 timestamp; // The timestamp when the user waved.
	bool won;
}


contract WavePortal {
	uint256 waversCount = 0;
	uint256 uniquesCount = 0;
	address owner;
	mapping (address => uint256) WaveAddresses;
	mapping (uint => address) private countToAddress;
	Wave[] waves;
	uint256 prizeAmount = 0.0001 ether;
	uint256 chanceToWin = 50;

	uint256 private seed;
    mapping(address => uint256) public lastWavedAt;


    event NewWave(address indexed from, uint256 timestamp, bool won);

	constructor() payable {
		owner = msg.sender;
		seed = (block.timestamp + block.difficulty) % 100;

    }

	// set the chance to win
	function setChanceToWin(uint256 _chance) public {
		require(msg.sender == owner, 'Cant set chance to win if not owner');
		require(_chance <= 100);
		chanceToWin = _chance;
	}

	// get the change to win
	function getChanceToWin() public view returns (uint256) {
		require(msg.sender == owner, 'Cant set chance to win if not owner');
		return chanceToWin;
	}

	// edit prizeAmount
	function setPrizeAmount(uint256 _prizeAmount) public {
		require(msg.sender == owner, "Only the owner can edit the prize amount.");
		prizeAmount = _prizeAmount;
	}

	// get prizeAmount
	function getPrizeAmount() public view returns (uint256) {
		return prizeAmount;
	}

	// get contract balance
	function getBalance() public view returns (uint256) {
		return address(this).balance;
	}

    function wave(string memory _message) public {
		require(lastWavedAt[msg.sender] + 30 seconds < block.timestamp, "Must wait 30 seconds before waving again.");

		lastWavedAt[msg.sender] = block.timestamp;

		bool won = pickWinner();

		waves.push(Wave(msg.sender, _message, block.timestamp, won));
		waversCount++;
		
		emit NewWave(msg.sender, block.timestamp, won);
	}

	// pick winner with chance 50%
	function pickWinner() private returns(bool) {
		seed = (block.difficulty + block.timestamp + seed) % 100;

		 /*
         * Give a 50% chance that the user wins the prize.
         */
        if (seed <= chanceToWin) {
            /*
             * The same code we had before to send the prize.
             */
            require(
                prizeAmount <= address(this).balance,
                "Trying to withdraw more money than the contract has."
            );
            (bool success, ) = (msg.sender).call{value: prizeAmount}("");
            require(success, "Failed to withdraw money from contract.");
			return true;
        }

		return false;
	}

	
    function getTotalWaves() public view returns (uint256) {
        return waversCount;
    }
	
	function getAllWaves() public view returns (Wave[] memory) {
        return waves;
    }

	function getUniqueWavers() public view returns (uint256) {
		return uniquesCount;
	}

}