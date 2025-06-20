# OmikujiNFT コントラクト

このディレクトリは Hardhat プロジェクトです。NFT コントラクトの開発・テスト・デプロイに使用します。

## 使い方

1. 依存関係のインストール

```bash
npm install
```

2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、RPC の URL や秘密鍵を記入します。

3. テスト実行

```bash
npm test
```

4. Amoy テストネットへデプロイ

```bash
npm run deploy
```

テストネットの設定値は `hardhat.config.js` を参照してください。
