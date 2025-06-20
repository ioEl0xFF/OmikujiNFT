// =============================================================
// OmikujiNFT.test.js（Hardhat）
// -------------------------------------------------------------
// このファイルは "OmikujiNFT.sol" コントラクトのユニットテストです。
// Hardhat・Mocha・Chai を組み合わせて、コントラクトが
// 期待どおりに動作するかを検証します。
// =============================================================

// ★ テスト環境のユースフルポイント ──────────────────────────
// 1. loadFixture         : 同じデプロイ処理を複数のテストで共有し、毎回
//                          クリーンなブロックチェーン状態を再利用できます。
// 2. describe / it       : Mocha の BDD スタイル記法。テストをグループ化し、
//                          個別の動作を人間が読める文で記述します。
// 3. expect (Chai)       : アサーション。値が“こうであるはず”を宣言的に書けます。
// 4. ethers (グローバル) : Hardhat 実行時に自動で注入される Ethers.js。import 不要。
// ----------------------------------------------------------------

const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

// ▼ テスト対象のトップレベルスイート
describe("OmikujiNFT", function () {
  // -------------------------------
  // テスト用コントラクトを用意する補助関数
  // -------------------------------
  async function deployFixture() {
    // Hardhat が提供するダミーアカウントを 2 つ取得
    const [owner, user] = await ethers.getSigners();

    // Chainlink VRF を模倣するモックコントラクトをデプロイ
    const Coordinator = await ethers.getContractFactory("VRFCoordinatorV2PlusMock");
    const coordinator = await Coordinator.deploy();

    // IPFS 上のメタデータ URI を配列で準備
    // インデックス 0 が "大吉" というように運勢に対応させています。
    const uris = [
      "ipfs://cid/daikichi.json",   // 大吉
      "ipfs://cid/kichi.json",     // 吉
      "ipfs://cid/chuukichi.json", // 中吉
      "ipfs://cid/syoukichi.json", // 小吉
      "ipfs://cid/kyou.json",      // 凶
    ];

    // OmikujiNFT コントラクトをデプロイ
    // コンストラクタ引数:
    //  1) 運勢 URI 配列
    //  2) VRF Coordinator アドレス
    //  3) サブスクリプション ID (ここではテストなので 1)
    //  4) 初期の IPFS CID ハッシュ (ダミー: ethers.ZeroHash)
    const OmikujiNFT = await ethers.getContractFactory("OmikujiNFT");
    const nft = await OmikujiNFT.deploy(uris, coordinator.target, 1, ethers.ZeroHash);

    // テストで使いたいオブジェクトを返却
    return { nft, coordinator, owner, user };
  }

  // =============================================================
  // mintOmikuji() のテスト
  // =============================================================
  describe("mintOmikuji", function () {
    it("リクエスト送信者を記録し、fulfill 後にトークンをミントする", async function () {
      // 1. 毎回クリーンな環境で fixture を読み込む
      const { nft, coordinator, user } = await loadFixture(deployFixture);

      // 2. user アカウントで mintOmikuji() を呼び出し
      await nft.connect(user).mintOmikuji();

      // ▼ VRF リクエスト ID をテストでは 1 と仮定
      const requestId = 1n;

      // 3. コントラクトがリクエスト ID に対して sender を記録しているか確認
      expect(await nft.requestToSender(requestId)).to.equal(user.address);

      // 4. モックの VRF Coordinator で fulfill() を呼び、乱数 "3" を返す
      //    乱数 "3" → uris[3] = 小吉 (syoukichi)
      await coordinator.fulfill(requestId, [3]);

      // 5. ミント後の状態を検証
      expect(await nft.tokenCounter()).to.equal(1);                         // トークン総数が 1 になったか
      expect(await nft.ownerOf(0)).to.equal(user.address);                  // トークン #0 の所有者が user か
      expect(await nft.tokenURI(0)).to.equal("ipfs://cid/syoukichi.json"); // 正しい URI が返るか
    });
  });

  // =============================================================
  // setIpfsCid() のテスト
  // =============================================================
  describe("setIpfsCid", function () {
    it("全 URI を更新し、イベントを発火する", async function () {
      const { nft } = await loadFixture(deployFixture);

      // 新しい CID を用意 (例: NFT 画像を差し替えた場合など)
      const cid = "bafcid";

      // ① 関数呼び出し時に IpfsCidUpdated イベントが emit されるか確認
      await expect(nft.setIpfsCid(cid))
        .to.emit(nft, "IpfsCidUpdated")
        .withArgs(cid);

      // ② 配列 uris が新しい CID に置き換わっているか確認
      expect(await nft.uris(0)).to.equal(`ipfs://${cid}/daikichi.json`);
      expect(await nft.uris(4)).to.equal(`ipfs://${cid}/kyou.json`);
    });

    it("空文字 CID の場合は revert する", async function () {
      const { nft } = await loadFixture(deployFixture);

      // "" を渡すと custom error "EmptyCid" で revert する想定
      await expect(nft.setIpfsCid(""))
        .to.be.revertedWithCustomError(nft, "EmptyCid");
    });
  });
});
