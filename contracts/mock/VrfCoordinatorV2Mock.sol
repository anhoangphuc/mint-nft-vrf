// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.12;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract VrfCoordinatorV2Mock {
    uint256 public counter;
    mapping(uint256 => address) requestIdToSender;

    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external returns (uint256 requestId) {
        requestId = counter;
        requestIdToSender[requestId] = msg.sender;
        counter++;
    }

    function rawFulfillRandomWords(uint256 requestId_) public {
        VRFConsumerBaseV2 consumer = VRFConsumerBaseV2(requestIdToSender[requestId_]);
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = requestId_;
        consumer.rawFulfillRandomWords(requestId_, randomWords);
    }
}