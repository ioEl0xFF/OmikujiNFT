const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

// OmikujiNFTコントラクトの基本機能を検証するテスト

describe("OmikujiNFT", function () {
  async function deployFixture() {
    const [owner, user] = await ethers.getSigners();

    // テスト用のVRFコーディネーターをデプロイ
    const Coordinator = await ethers.getContractFactory("VRFCoordinatorV2PlusMock");
    const coordinator = await Coordinator.deploy();

    // コントラクト初期化時に使うURI一覧
    const uris = [
      "ipfs://cid/daikichi.json",
      "ipfs://cid/kichi.json",
      "ipfs://cid/chuukichi.json",
      "ipfs://cid/syoukichi.json",
      "ipfs://cid/kyou.json",
    ];

    const OmikujiNFT = await ethers.getContractFactory("OmikujiNFT");
    const nft = await OmikujiNFT.deploy(uris, coordinator.target, 1, ethers.ZeroHash);

    return { nft, coordinator, owner, user };
  }

  describe("mintOmikuji", function () {
    it("records sender and mints token after fulfillment", async function () {
      const { nft, coordinator, user } = await loadFixture(deployFixture);

      // ユーザーがmintを実行
      // モックはリクエストID1を返す想定
      await nft.connect(user).mintOmikuji();
      const requestId = 1n;

      // requestToSenderにミンターのアドレスが記録される
      expect(await nft.requestToSender(requestId)).to.equal(user.address);

      // 決め打ちの乱数3でfulfillを実行
      await coordinator.fulfill(requestId, [3]);

      // トークン0が発行されユーザーの所有になる
      expect(await nft.tokenCounter()).to.equal(1);
      expect(await nft.ownerOf(0)).to.equal(user.address);
      expect(await nft.tokenURI(0)).to.equal("ipfs://cid/syoukichi.json");
    });
  });

  describe("setIpfsCid", function () {
    it("updates all uris and emits event", async function () {
      const { nft, owner } = await loadFixture(deployFixture);
      const cid = "bafcid";
        // CIDを更新すると全てのURIが置き換わり、イベントが発生するか確認
      await expect(nft.setIpfsCid(cid)).to.emit(nft, "IpfsCidUpdated").withArgs(cid);
      expect(await nft.uris(0)).to.equal(`ipfs://${cid}/daikichi.json`);
      expect(await nft.uris(4)).to.equal(`ipfs://${cid}/kyou.json`);
    });

    it("reverts with empty cid", async function () {
      const { nft } = await loadFixture(deployFixture);
        // 空文字を渡した場合はカスタムエラーになるか確認
      await expect(nft.setIpfsCid("")).to.be.revertedWithCustomError(nft, "EmptyCid");
    });
  });
});
