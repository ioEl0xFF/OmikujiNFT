// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// 必要なライブラリのインポート
// ERC721URIStorage: NFTのメタデータ（画像URLや説明文など）を保存できる機能を提供
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// Chainlink VRF（Verifiable Random Function）関連のインポート
// これにより、ブロックチェーン上で安全な乱数を生成できます
import "./chainlink/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "./chainlink/vrf/dev/libraries/VRFV2PlusClient.sol";
import "./chainlink/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";

// おみくじNFTのメインコントラクト
// ERC721URIStorageを継承してNFT機能を実装
// VRFConsumerBaseV2Plusを継承して乱数生成機能を実装
contract OmikujiNFT is ERC721URIStorage, VRFConsumerBaseV2Plus {
    // Chainlink VRFの機能を使用するためのライブラリ
    using VRFV2PlusClient for VRFV2PlusClient.RandomWordsRequest;

    // Chainlink VRFの設定値
    uint256 public s_subscriptionId;         // ChainlinkのサブスクリプションID（有料サービス）
    bytes32 public keyHash;                  // 使用するVRFの一意の識別子
    uint32 public callbackGasLimit = 2500000;// コールバック関数の実行に使用するガス量
    uint16 public requestConfirmations = 3;  // 乱数生成前に待機するブロック数（安全性のため）
    uint32 public numWords = 1;              // 生成する乱数の数（今回は1つ）

    // 状態変数
    mapping(uint256 => address) public requestToSender; // リクエストIDとミントした人のアドレスの対応表
    uint256 public tokenCounter;                        // 発行されたNFTの総数
    string[5] public uris;                              // おみくじの結果（大吉～凶）ごとのメタデータURI

    // コントラクトの初期化（デプロイ時に1回だけ実行）
    constructor(
        string[5] memory _uris,              // 5種類のおみくじ結果のメタデータURI
        address vrfCoordinator,              // Chainlink VRFのコーディネーターアドレス
        uint256 subscriptionId,              // ChainlinkのサブスクリプションID
        bytes32 _keyHash                     // VRFのkeyHash
    ) ERC721("OmikujiNFT", "OMK") VRFConsumerBaseV2Plus(vrfCoordinator) {
        uris = _uris;
        s_subscriptionId = subscriptionId;
        keyHash = _keyHash;
        tokenCounter = 0;
    }

    // おみくじを引く（NFTをミントする）関数
    function mintOmikuji() public returns (uint256 requestId) {
        // Chainlink VRFに乱数生成をリクエスト
        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: s_subscriptionId,
            requestConfirmations: requestConfirmations,
            callbackGasLimit: callbackGasLimit,
            numWords: numWords,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
            )
        });

        // 乱数生成をリクエストし、リクエストIDを取得
        requestId = s_vrfCoordinator.requestRandomWords(req);
        // リクエストIDとミントした人のアドレスを紐付け
        requestToSender[requestId] = msg.sender;
    }

    // Chainlink VRFから乱数を受け取った時に実行される関数
    function fulfillRandomWords(
        uint256 requestId,                   // リクエストID
        uint256[] calldata randomWords       // 生成された乱数の配列
    ) internal override(VRFConsumerBaseV2Plus) {
        // リクエストIDからミントした人のアドレスを取得
        address minter = requestToSender[requestId];
        // 乱数を5で割った余り（0-4）を取得（5種類のおみくじ結果に対応）
        uint256 result = randomWords[0] % 5;

        // NFTをミント（発行）
        _safeMint(minter, tokenCounter);
        // おみくじ結果に対応するメタデータURIを設定
        _setTokenURI(tokenCounter, uris[result]);
        // トークンカウンターを増やす
        tokenCounter++;
    }
}
