// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.12;

import "./interfaces/ISummoner.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract Summoner is ERC721Upgradeable, AccessControlUpgradeable, ISummonerUpgradeable {

    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

    function initialize() public initializer {
        __ERC721_init('Summoner', 'SMN');
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return ERC721Upgradeable.supportsInterface(interfaceId)
            || AccessControlUpgradeable.supportsInterface(interfaceId);
    }

    function mint(address to, uint256 tokenId) external {
        require(hasRole(MINTER_ROLE, msg.sender), 'mint:: not minter'); 
        _safeMint(to, tokenId);
    }
}