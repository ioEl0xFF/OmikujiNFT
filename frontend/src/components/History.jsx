// History.jsx
// -----------------------------------------------------------------------------
// ユーザーがこれまでにミントした Omikuji NFT（おみくじ NFT）の履歴を一覧表示するコンポーネント。
// ・ウォレットアドレスが変わるたびに自動で再取得
// ・取得失敗時もアプリが落ちないように Promise.allSettled を活用
// 初学者が押さえたいポイントは「useEffect × useCallback の依存配列」と
// 「async/await での例外処理（try / catch / finally）」です。
// -----------------------------------------------------------------------------

import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import OmikujiABI from '../abi/OmikujiNFT.json';

// ---------------------------------
// 定数定義
// ---------------------------------
const CONTRACT = '0x5be785cec89933d514db3d531ba5db2faf2504e0'; // デプロイ済みコントラクトのアドレス
const GATEWAY = 'https://gateway.lighthouse.storage/ipfs/'; // IPFS→HTTP 変換ゲートウェイ

// ipfs:// で始まる URI を HTTP URL へ変換
const ipfs2http = (uri) => uri.replace('ipfs://', GATEWAY);

// メタデータ URI と画像ファイル名から画像 URL を生成
const convImgUrl = (uri, img) => {
    const url = ipfs2http(uri); // 例: https://gateway.../QmMetaData.json
    return url.replace(url.split('/').pop(), img); // 末尾の json を画像名に置換
};

export default function History({ wallet, refreshTrigger }) {
    // ---------------------------------
    // React hooks
    // ---------------------------------
    const [tokens, setTokens] = useState([]); // 取得した NFT 一覧
    const [loading, setLoading] = useState(false); // ローディング状態

    /**
     * ユーザーが保有する NFT 情報を取得して tokens に格納する
     */
    const loadTokens = useCallback(async () => {
        if (!wallet) return; // 未接続なら何もしない
        setLoading(true);
        try {
            // ---- Ethers.js の初期化（読み取り専用なので signer 不要） ----
            const provider = new ethers.BrowserProvider(window.ethereum);
            const abi = OmikujiABI.abi ?? OmikujiABI; // truffle と hardhat の両対応
            const contract = new ethers.Contract(CONTRACT, abi, provider);

            // ---- Token ID の一覧を取得 ----
            let tokenIds = [];

            // (A) Enumerable な実装の場合
            if (typeof contract.tokenOfOwnerByIndex === 'function') {
                const balance = Number(await contract.balanceOf(wallet));
                tokenIds = await Promise.all(
                    [...Array(balance)].map((_, i) =>
                        contract.tokenOfOwnerByIndex(wallet, i).then((id) => id.toString())
                    )
                );
           }
            // (B) Enumerable でない実装の場合：Transfer イベントを遡る
            else {
                const latest = await provider.getBlockNumber();
                const evts = await contract.queryFilter(
                    contract.filters.Transfer(null, wallet),
                    latest - 10000, // 直近1万ブロックを検索
                    'latest'
                );
                tokenIds = evts.map((e) => BigInt(e.args.tokenId).toString());
            }

            // 昇順ソート（古い順）
            tokenIds.sort((a, b) => Number(a) - Number(b));

            // ---- 個々のメタデータを取得 ----
            const results = await Promise.allSettled(
                tokenIds.map(async (id) => {
                    const uri = await contract.tokenURI(id); // ipfs://...
                    let meta;
                    try {
                        meta = await fetch(ipfs2http(uri)).then((r) => r.json());
                    } catch {
                        return null; // メタデータ取得に失敗した NFT はスキップ
                    }
                    return {
                        tokenId: id,
                        name: meta.name,
                        description: meta.description,
                        image: convImgUrl(uri, meta.image),
                    };
                })
            );
            // fulfilled のみ抽出してステート更新
            setTokens(results.filter((r) => r.status === 'fulfilled').map((r) => r.value));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [wallet]);

    // -----------------------------
    // エフェクト: ウォレット接続・リフレッシュのたびに取得
    // -----------------------------
    useEffect(() => {
        loadTokens();
    }, [loadTokens, refreshTrigger]);

    // -----------------------------
    // 表示パート (JSX)
    // -----------------------------
    if (!wallet) return <p>ウォレットを接続してください</p>;
    if (loading) return <p>ロード中...</p>;
    if (!tokens.length) return <p>まだミント履歴がありません</p>;

    return (
        <div
            style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))',
            }}
        >
            {tokens.map((token) => (
                <div
                    key={token.tokenId}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #ccc',
                        borderRadius: 8,
                        padding: 8,
                        gap: 16,
                        backgroundColor: '#1e1e1e',
                        color: 'white',
                        maxWidth: 400,
                    }}
                >
                    {/* NFT サムネイル */}
                    <img
                        src={token.image}
                        alt={token.name}
                        style={{ width: 64, height: 'auto', borderRadius: 4 }}
                    />
                    {/* NFT 名称と ID */}
                    <div>
                        <h4 style={{ margin: '0 0 4px 0' }}>{token.name}</h4>
                        <small style={{ fontSize: 12 }}>ID: {token.tokenId}</small>
                    </div>
                </div>
            ))}
        </div>
    );
}
