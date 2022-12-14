// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20 {
    constructor() ERC20('WETH', 'WETH') {}

    function mint() external {
        _mint(msg.sender, 1000000000 ether);
    }
}