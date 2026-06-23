// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Reputation {

    struct ReputationData {
        uint8 score;
        uint256 lastUpdated;
    }

    mapping(bytes32 => ReputationData) private reputations;
    mapping(address => bool) public authorizedBanks;

    address public owner;

    event ReputationUpdated(
        bytes32 indexed entityHash,
        uint8 oldScore,
        uint8 newScore,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorizedBank() {
        require(
            authorizedBanks[msg.sender],
            "Not an authorized bank"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addBank(address bank)
        external
        onlyOwner
    {
        authorizedBanks[bank] = true;
    }

    function updateReputation(
        bytes32 entityHash,
        uint8 newScore
    )
        external
        onlyAuthorizedBank
    {
        require(
            newScore <= 100,
            "Score must be 0-100"
        );

        uint8 oldScore =
            reputations[entityHash].score;

        reputations[entityHash] =
            ReputationData(
                newScore,
                block.timestamp
            );

        emit ReputationUpdated(
            entityHash,
            oldScore,
            newScore,
            block.timestamp
        );
    }

    function getReputation(
        bytes32 entityHash
    )
        external
        view
        returns (
            uint8 score,
            uint256 lastUpdated
        )
    {
        ReputationData memory rep =
            reputations[entityHash];

        return (
            rep.score,
            rep.lastUpdated
        );
    }
}