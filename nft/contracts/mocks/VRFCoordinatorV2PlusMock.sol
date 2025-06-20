// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../chainlink/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "../chainlink/vrf/dev/libraries/VRFV2PlusClient.sol";

/// @title Minimal mock of Chainlink VRFCoordinatorV2Plus
/// @dev This contract only implements the functions used in tests
contract VRFCoordinatorV2PlusMock {
    uint256 public nextRequestId = 1;
    mapping(uint256 => address) public consumers;

    /// @notice Simulate random words request
    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata /*req*/
    ) external returns (uint256 requestId) {
        requestId = nextRequestId++;
        consumers[requestId] = msg.sender;
    }

    /// @notice Call consumer with provided random words
    function fulfill(uint256 requestId, uint256[] calldata randomWords) external {
        address consumer = consumers[requestId];
        require(consumer != address(0), "invalid requestId");
        VRFConsumerBaseV2Plus(consumer).rawFulfillRandomWords(requestId, randomWords);
    }
}
