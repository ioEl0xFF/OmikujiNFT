// MintButton.jsx
// -----------------------------------------------------------------------------
// 1) ウォレット接続ボタン
// 2) コントラクトの mintOmikuji() を呼び出すボタン
// 3) ミント直後の最新 NFT を画面にプレビュー
// React と Ethers.js の最小構成で実装しています。
// -----------------------------------------------------------------------------

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import OmikujiABI from '../abi/OmikujiNFT.json';
import { toast } from 'react-toastify';

// ------------------------------
// 定数
// ------------------------------
const CONTRACT = '0x99bc40bebc8678672ec8419be1c56ba048dd11fd';
const GATEWAY = 'https://gateway.lighthouse.storage/ipfs/';

// ipfs:// URI → HTTP
const ipfs2http = (uri) => uri.replace('ipfs://', GATEWAY);
// 画像 URL へ変換
const convImgUrl = (uri, img) => {
    const url = ipfs2http(uri);
    return url.replace(url.split('/').pop(), img);
};

export default function MintButton({ onConnect, onMintSuccess }) {
    // ------------------------------
    // React hooks
    // ------------------------------
    const [wallet, setWallet] = useState(null); // 接続中アカウント
    const [txPending, setTxPending] = useState(false); // トランザクション待機中フラグ
    const [nft, setNft] = useState(null); // 最新ミント NFT のメタ情報

    /**
     * MetaMask と接続し、アカウントを取得
     */
    const connectWallet = useCallback(async () => {
        if (!window.ethereum) return toast.error('MetaMask をインストールしてください');

        try {
            // eth_requestAccounts: 利用者に接続許可を求める標準メソッド
            const [account] = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
            setWallet(account);
            localStorage.setItem('wallet', account); // 自動再接続用
            onConnect?.(account);
            toast.success('ウォレット接続完了');
        } catch (e) {
            const msg = e?.error?.data?.message ?? e?.message;
            toast.error(`TX 失敗: ${msg}`);
            toast.error('ウォレット接続が拒否されました');
        }
    }, [onConnect]);

    /**
     * サイン済みコントラクトインスタンスを取得
     */
    const getContract = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner(); // トランザクション署名者
        return new ethers.Contract(CONTRACT, OmikujiABI.abi, signer);
    };

    /**
     * コントラクトの mintOmikuji() を実行
     */
    const mintOmikuji = useCallback(async () => {
        if (!wallet) return toast.warn('ウォレットを接続してください');
        setTxPending(true);
        try {
            const contract = await getContract();
            // ① トランザクション送信
            const tx = await contract.mintOmikuji();
            toast.info('トランザクション送信...');
            // ② ブロック確定まで待機
            await tx.wait();
            toast.success('ミント成功！');
            // ③ 最新 NFT を取得・表示
            await fetchLastNFT(contract);
            onMintSuccess?.();
        } catch (e) {
            toast.error(e?.message ?? 'トランザクション失敗');
            console.error(e);
        } finally {
            setTxPending(false);
        }
    }, [wallet, onMintSuccess]);

    /**
     * コントラクトから直近の NFT を 1 つ取得し、state にセット
     */
    const fetchLastNFT = async (contract) => {
        try {
            const counter = await contract.tokenCounter();
            if (counter === 0n) return;
            const id = counter - 1n;
            const uri = await contract.tokenURI(id);
            const meta = await fetch(ipfs2http(uri)).then((r) => r.json());
            setNft({ ...meta, image: convImgUrl(uri, meta.image) });
        } catch (e) {
            toast.error('NFT メタデータ取得失敗');
            console.error(e);
        }
    };

    // ページ再読み込み時に自動でウォレットアドレスを復元
    useEffect(() => {
        const stored = localStorage.getItem('wallet');
        if (stored) setWallet(stored);
    }, []);

    // ------------------------------
    // 表示 (JSX)
    // ------------------------------
    return (
        <div className="space-y-2">
            {/* ウォレット接続ボタン */}
            <button className="btn" onClick={connectWallet}>
                {wallet ? `接続済: ${wallet.slice(0, 6)}…` : 'ウォレット接続'}
            </button>

            {/* mint ボタン：ウォレット接続済み & TX 未処理の時だけ有効 */}
            <button className="btn" onClick={mintOmikuji} disabled={!wallet || txPending}>
                占う（NFT ミント）
            </button>

            {/* 直近でミントした NFT のプレビュー */}
            {nft && (
                <div className="border rounded p-4">
                    <h3>{nft.name}</h3>
                    <p>{nft.description}</p>
                    <img
                        src={nft.image}
                        alt={nft.name}
                        style={{ width: '50%', height: 'auto' }}
                        className="w-1/2 h-auto"
                    />
                </div>
            )}
        </div>
    );
}
