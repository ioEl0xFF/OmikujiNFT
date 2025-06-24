# OmikujiNFT

## 概要

**Omikuji NFT** は、ユーザーがボタンを押すだけでランダムなおみくじ結果を生成し、その内容を NFT としてミントする DApp です。ランダム性は Chainlink VRF により担保され、生成された NFT には運勢に応じた画像とメッセージが IPFS 上に保存されます。

### 前提条件

- Node.js 20 以上
- npm または Yarn
- MetaMask などの Ethereum ウォレット

## 使用技術

| カテゴリ             | 技術                                    |
| -------------------- | --------------------------------------- |
| スマートコントラクト | Solidity / OpenZeppelin / Chainlink VRF |
| フレームワーク       | Hardhat                                 |
| フロントエンド       | React (Vite) / Ethers.js / Toastify     |
| ストレージ           | IPFS（Lighthouse）                      |
| デプロイ             | Polygon Amoy Testnet                   |

## 主な機能

### ユーザー操作

-   MetaMask でウォレット接続
-   「占う」ボタンを押すと NFT がミントされる
-   成功後、最新の NFT 情報を即時表示

### ランダム性の実装

-   Chainlink VRF を用いてランダムな数値（0〜4）を取得
-   各数値に対応するおみくじ結果（大吉〜凶）を割り当て

### NFT の構成

-   `OmikujiNFT.sol`：ERC721 コントラクト + `mintOmikuji()` によりランダム生成
-   `daikichi.json` のようなメタデータを IPFS にホスト
-   `tokenURI` から画像と説明を読み込む構成

## ディレクトリ構成（抜粋）

```
OmikujiNFT/
├── frontend/
│   ├── src/components/
│   │   ├── MintButton.jsx
│   │   └── History.jsx
│   └── App.jsx
├── nft/
│   └── contracts/
│       └── OmikujiNFT.sol
├── omikuji-data/
│   └── daikichi.json
```

## 学びポイント

-   Solidity と React の連携による**フルスタック DApp 構築**
-   Chainlink VRF による**安全なランダム生成**
-   IPFS を使った**分散型ストレージの活用**
-   **トークン ID 履歴の取得ロジック**（`History.jsx`）

## 拡張アイデア

-   同じウォレットでの 1 日 1 回制限（`block.timestamp`ベース）
-   トークンに運気スコアを持たせる
-   管理者権限で IPFS の変更を可能にさせる

## ローカル環境での実行

以下の手順でコントラクトとフロントエンドを起動できます。

### 1. コントラクト側

```bash
cd nft
npm install
cp .env.example .env # RPC URL や秘密鍵を設定
npm test              # Hardhat テストを実行
npm run deploy        # Amoy テストネットへデプロイ
```

`.env` には `API_URL` と `PRIVATE_KEY` を設定します。`API_URL` は Polygon Amoy テストネットへの RPC エンドポイント、`PRIVATE_KEY` はデプロイに使用するウォレットの秘密鍵です。

### 2. フロントエンド側

```bash
cd frontend
npm install
npm run dev           # http://localhost:5173 で起動
```
