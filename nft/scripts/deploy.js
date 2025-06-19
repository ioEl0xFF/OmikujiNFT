// Hardhatの設定を読み込む
const hre = require('hardhat');

async function main() {
    // NFTのメタデータURIの配列
    // 各JSONファイルはIPFSにアップロード済みである必要があります
    const uris = [
        'ipfs://bafybeid4ilndtbixf5clomkdfeecn7qryue2bbxchleomp3s5433llp67a/daikichi.json',
        'ipfs://bafybeid4ilndtbixf5clomkdfeecn7qryue2bbxchleomp3s5433llp67a/kichi.json',
        'ipfs://bafybeid4ilndtbixf5clomkdfeecn7qryue2bbxchleomp3s5433llp67a/chuukichi.json',
        'ipfs://bafybeid4ilndtbixf5clomkdfeecn7qryue2bbxchleomp3s5433llp67a/syoukichi.json',
        'ipfs://bafybeid4ilndtbixf5clomkdfeecn7qryue2bbxchleomp3s5433llp67a/kyou.json',
    ];

    // Chainlink VRFの設定
    // Amoyテストネット用の設定値
    const vrfCoordinator = '0x343300b5d84D444B2ADc9116FEF1bED02BE49Cf2'; // VRFコーディネーターのアドレス
    const subscriptionId = BigInt(process.env.SUBSCRIPTION_ID); // ChainlinkのサブスクリプションID
    const keyHash = '0x816bedba8a50b294e5cbd47842baf240c2385f2eaf719edbd4f250a137a8c899'; // Gas Laneのキーハッシュ

    // コントラクトのデプロイ
    const OmikujiNFT = await hre.ethers.getContractFactory('OmikujiNFT');
    const contract = await OmikujiNFT.deploy(uris, vrfCoordinator, subscriptionId, keyHash);
    await contract.waitForDeployment();

    // デプロイ完了時のログ出力
    console.log('✅ OmikujiNFT with VRF deployed to:', await contract.getAddress());
}

// エラーハンドリング
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
