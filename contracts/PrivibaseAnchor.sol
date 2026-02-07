// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PrivibaseAnchor {
    event ConfidentialAlertTriggered(address indexed user, string messageType);

    function triggerAlert(string calldata messageType) external {
        emit ConfidentialAlertTriggered(msg.sender, messageType);
    }

    function triggerAlertFor(address user, string calldata messageType) external {
        emit ConfidentialAlertTriggered(user, messageType);
    }
}
