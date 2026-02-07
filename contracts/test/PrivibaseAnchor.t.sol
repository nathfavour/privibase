// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../PrivibaseAnchor.sol";

contract PrivibaseAnchorTest is Test {
    PrivibaseAnchor public anchor;

    event ConfidentialAlertTriggered(address indexed user, string messageType);

    function setUp() public {
        anchor = new PrivibaseAnchor();
    }

    function testTriggerAlert() public {
        vm.expectEmit(true, false, false, true);
        emit ConfidentialAlertTriggered(address(this), "TEST_ALERT");
        anchor.triggerAlert("TEST_ALERT");
    }

    function testTriggerAlertFor() public {
        address user = address(0x123);
        vm.expectEmit(true, false, false, true);
        emit ConfidentialAlertTriggered(user, "REMOTE_ALERT");
        anchor.triggerAlertFor(user, "REMOTE_ALERT");
    }
}
