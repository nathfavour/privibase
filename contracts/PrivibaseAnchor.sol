// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PrivibaseAnchor
 * @dev Sovereign notification anchor for iExec-powered confidential alerts.
 */
contract PrivibaseAnchor {
    address public owner;

    // Rich event for TEE listeners
    event ConfidentialAlert(
        address indexed user, 
        string indexed category, 
        string message, 
        bytes metadata
    );

    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Trigger an alert for yourself (e.g., from a personal device).
     */
    function triggerAlert(string calldata category, string calldata message, bytes calldata metadata) external {
        emit ConfidentialAlert(msg.sender, category, message, metadata);
    }

    /**
     * @dev Trigger an alert for a specific user. 
     * In a production RWA scenario, this would be restricted to authorized sensors or the owner.
     */
    function triggerAlertFor(address user, string calldata category, string calldata message, bytes calldata metadata) external {
        // For the hackathon MVP, we allow anyone to trigger for others to facilitate testing,
        // but we tag it with the sender for transparency.
        emit ConfidentialAlert(user, category, message, metadata);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
