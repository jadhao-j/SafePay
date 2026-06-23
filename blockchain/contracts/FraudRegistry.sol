// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FraudRegistry {

    struct FraudSignal {
        bool isFraud;
        uint8 entityType;
        uint256 reportedAt;
        address reportingBank;
    }

    mapping(bytes32 => FraudSignal) private fraudSignals;
    mapping(address => bool) public authorizedBanks;

    address public owner;
    uint256 private totalSignals;

    event FraudReported(
        bytes32 indexed entityHash,
        uint8 entityType,
        address indexed reportingBank,
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

    function reportFraud(
        bytes32 entityHash,
        uint8 entityType
    )
        external
        onlyAuthorizedBank
    {
        require(
            entityType <= 2,
            "Invalid entity type"
        );

        fraudSignals[entityHash] = FraudSignal(
            true,
            entityType,
            block.timestamp,
            msg.sender
        );

        totalSignals++;

        emit FraudReported(
            entityHash,
            entityType,
            msg.sender,
            block.timestamp
        );
    }

    function checkSignal(
        bytes32 entityHash
    )
        external
        view
        returns (
            bool isFraud,
            uint256 reportedAt,
            address reportingBank
        )
    {
        FraudSignal memory signal =
            fraudSignals[entityHash];

        return (
            signal.isFraud,
            signal.reportedAt,
            signal.reportingBank
        );
    }

    function getTotalSignals()
        external
        view
        returns (uint256)
    {
        return totalSignals;
    }
}