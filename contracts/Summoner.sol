// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.12;

import "./interfaces/ISummoner.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";

contract Summoner is 
    ERC721Upgradeable,
    ERC721PausableUpgradeable,
    ERC721EnumerableUpgradeable,
    ERC721RoyaltyUpgradeable,
    AccessControlUpgradeable,
    ISummonerUpgradeable 
    {
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
    bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
    string private _baseUri;

    function initialize(string calldata baseUri_, address receiver, uint96 feeNumerator) public initializer {
        __ERC721_init('Summoner', 'SMN');
        __ERC721Enumerable_init();
        __ERC721Pausable_init();
        __ERC721Royalty_init();
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _baseUri = baseUri_;
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable, ERC721RoyaltyUpgradeable) returns (bool) {
        return ERC721Upgradeable.supportsInterface(interfaceId)
            || ERC721EnumerableUpgradeable.supportsInterface(interfaceId)
            || ERC721RoyaltyUpgradeable.supportsInterface(interfaceId)
            || AccessControlUpgradeable.supportsInterface(interfaceId);
    }

    function mint(address to, uint256 tokenId) external {
        require(hasRole(MINTER_ROLE, msg.sender), 'mint::not minter'); 
        _safeMint(to, tokenId);
    }
    
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721PausableUpgradeable) {
        ERC721PausableUpgradeable._beforeTokenTransfer(from, to, tokenId);
        ERC721EnumerableUpgradeable._beforeTokenTransfer(from, to, tokenId);    
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseUri;        
    }

    function baseURI() external view returns (string memory) {
        return _baseURI();    
    }

    function setBaseUri(string memory newUri) external {
        require(hasRole(ADMIN_ROLE, msg.sender), 'setBaseUri:not admin');        
        _baseUri = newUri;
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721RoyaltyUpgradeable, ERC721Upgradeable) {
        ERC721RoyaltyUpgradeable._burn(tokenId);
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external {
        require(hasRole(ADMIN_ROLE, msg.sender), 'setBaseUri:not admin');
        _setDefaultRoyalty(receiver, feeNumerator);
    }
}