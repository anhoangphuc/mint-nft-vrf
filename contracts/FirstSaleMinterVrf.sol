// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.12;

import "./interfaces/ISummoner.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

contract FirstSaleMinterVrf is VRFConsumerBaseV2 {
    ISummonerUpgradeable public immutable summoner;
    VRFCoordinatorV2Interface public immutable COORDINATOR;
    bytes32 public immutable keyHash;
    uint64 public immutable subcriptionId;

    mapping(uint256 => address) requestIdToAddress;
    mapping(uint256 => bool) isRequestIdWhitelist; 

    mapping(uint16 => uint16) private _tokenMaleMatrix;
    mapping(uint16 => uint16) private _tokenFemaleMatrix;

    uint16 constant public FEMALE_INDEX_START = 3500;
    uint16 constant public WHITELIST_MINT = 500;
    uint16 constant public PUBLIC_MINT = 3000;
    uint16 constant public MALE_TOKEN = 3500;
    uint16 constant public FEMALE_TOKEN = 500;

    uint16 public publicMinted = 0;
    uint16 public whitelistMinted = 0;
    uint16 public maleMinted = 0;
    uint16 public femaleMinted = 0;

    event PublicMint(address indexed to, uint256 indexed maleId);
    event WhitelistMint(address indexed to, uint256 indexed maleId, uint256 indexed femaleId);

    constructor(address vrfCoordinator_, bytes32 keyHash_, uint64 subcriptionId_, address summoner_) VRFConsumerBaseV2(vrfCoordinator_){
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator_);
        keyHash = keyHash_;
        subcriptionId = subcriptionId_;

        summoner = ISummonerUpgradeable(summoner_);
    }

    function mintWhitelist() external {
        require(whitelistMinted < WHITELIST_MINT, 'whitelist::exceed');
        uint256 requestId = COORDINATOR.requestRandomWords(keyHash, subcriptionId, 3, 2500000, 1);
        requestIdToAddress[requestId] = msg.sender;
        isRequestIdWhitelist[requestId] = true;
        whitelistMinted++;
    }

    function mintPublic() external {
        require(publicMinted < PUBLIC_MINT, 'public::exceed');
        uint256 requestId = COORDINATOR.requestRandomWords(keyHash, subcriptionId, 3, 2500000, 1);
        requestIdToAddress[requestId] = msg.sender;
        publicMinted++;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address to = requestIdToAddress[requestId];
        uint256 randomValue = randomWords[0];
        if (isRequestIdWhitelist[requestId]) {
            _mintWhitelist(to, randomValue);
        } else {
            _mintPublic(to, randomValue);
        }
    }

    function _mintWhitelist(address to, uint256 randomValue) internal {
        uint16 maleId = _mintMale(to, maleMinted, randomValue);
        maleMinted++;

        uint16  femaleId = _mintFemale(to, femaleMinted, randomValue);
        femaleMinted++;

        emit WhitelistMint(to, maleId, femaleId);
    }
    
    function _mintPublic(address to, uint256 randomValue) internal {
        uint16 maleId = _mintMale(to, maleMinted, randomValue);
        maleMinted++;

        emit PublicMint(to, maleId);
    }


    function _mintMale(address to, uint16 tokenMinted_, uint256 randomValue) internal returns (uint16) {
        uint16 tokenId = _getMaleTokenToBeMinted(tokenMinted_, randomValue);
        summoner.mint(to, tokenId);
        return tokenId;
    }

    function _mintFemale(address to, uint16 tokenMinted_, uint256 randomValue) internal returns (uint16) {
        uint16 tokenId = _getFemaleTokenToBeMinted(tokenMinted_, randomValue);
        summoner.mint(to, tokenId);
        return tokenId;
    }

    function _getMaleTokenToBeMinted(uint16 tokenMinted_, uint256 randomValue) internal returns (uint16 tokenId) {
        uint16 maxIndex = MALE_TOKEN - tokenMinted_;
        uint16 randomNumber = uint16(randomValue % maxIndex);
        
        //gas saving
        uint16 ind = _tokenMaleMatrix[randomNumber];
        tokenId = ind == 0 ? randomNumber : ind;

        _tokenMaleMatrix[randomNumber] = _tokenMaleMatrix[maxIndex - 1] == 0 ? maxIndex - 1 : _tokenMaleMatrix[maxIndex - 1];
    }

    function _getFemaleTokenToBeMinted(uint16 tokenMinted_, uint256 randomValue) internal returns (uint16 tokenId) {
        uint16 maxIndex = FEMALE_TOKEN - tokenMinted_;
        uint16 randomNumber = uint16(randomValue % maxIndex);
        
        //gas saving
        uint16 ind = _tokenFemaleMatrix[randomNumber];
        tokenId = ind == 0 ? randomNumber : ind;

        _tokenFemaleMatrix[randomNumber] = _tokenFemaleMatrix[maxIndex - 1] == 0 ? maxIndex - 1 : _tokenFemaleMatrix[maxIndex - 1];
        tokenId += FEMALE_INDEX_START;
    }
}
