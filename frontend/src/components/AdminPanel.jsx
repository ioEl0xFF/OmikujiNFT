// React のフックを読み込みます
import { useEffect, useState, useCallback } from 'react';
// ブラウザウォレットとの通信に ethers.js を使用
import { ethers } from 'ethers';
// コンパイル済みコントラクトの ABI
import OmikujiABI from '../abi/OmikujiNFT.json';
// 画面下のトースト通知用
import { toast } from 'react-toastify';
// デプロイ済みコントラクトのアドレスを定数から取得
import { CONTRACT_ADDRESS } from '../constants';

// アプリ全体で使うコントラクトアドレス
const CONTRACT = CONTRACT_ADDRESS;

// wallet には接続中ウォレットのアドレスが渡されます
export default function AdminPanel({ wallet }) {
    // 接続しているアドレスがオーナーかどうか
    const [isOwner, setIsOwner] = useState(false);
    // 入力フォームに表示する CID
    const [cid, setCid] = useState('');
    // コントラクトに保存されている URI 一覧
    const [uris, setUris] = useState([]);

    // コントラクトを読み取り専用で取得
    const getReadContract = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        return new ethers.Contract(CONTRACT, OmikujiABI.abi, provider);
    };

    // 書き込み権限を持ったコントラクトを取得
    const getWriteContract = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(CONTRACT, OmikujiABI.abi, signer);
    };

    // コントラクトから現在の状態を取得する
    const loadData = useCallback(async () => {
        if (!wallet) return; // ウォレット未接続なら何もしない
        try {
            const contract = await getReadContract();
            const owner = (await contract.owner()).toLowerCase();
            const isOwnerAddr = owner === wallet.toLowerCase();
            console.log('AdminPanel loadData', {
                owner,
                wallet,
                isOwner: isOwnerAddr,
            });
            setIsOwner(isOwnerAddr);
            if (!isOwnerAddr) return; // 権限がなければ終了
            const arr = [];
            for (let i = 0; i < 5; i++) {
                // 各 URI を順に取得
                arr.push(await contract.uris(i));
            }
            setUris(arr);
            if (arr[0]) {
                // URI から CID 部分のみを抽出
                const tmp = arr[0].replace('ipfs://', '').split('/')[0];
                setCid(tmp);
            }
        } catch (e) {
            console.error('AdminPanel loadData error:', e);
            toast.error('データ取得に失敗しました');
        }
    }, [wallet]);

    // 画面表示時に一度だけデータを読み込む
    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateCid = async () => {
        if (!isOwner) return; // オーナー以外は実行不可
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            const signer = await provider.getSigner();
            const userAddr = await signer.getAddress();
            const read = await getReadContract();
            const owner = await read.owner();
            // 更新開始前に各種情報を表示
            console.log('CID update start', {
                cid,
                owner,
                user: userAddr,
                network: {
                    chainId: network.chainId.toString(),
                    name: network.name,
                },
            });
            const contract = await getWriteContract();
            const tx = await contract.setIpfsCid(cid);
            toast.info('更新トランザクション送信');
            await tx.wait();
            toast.success('CID 更新完了');
            loadData(); // 更新後に再取得
        } catch (e) {
            console.error('AdminPanel updateCid error:', {
                message: e?.message,
                code: e?.code,
                data: e?.data,
                reason: e?.reason,
                stack: e?.stack,
            });
            toast.error('更新に失敗しました');
        }
    };

    // 管理者でなければ画面には何も表示しない
    if (!isOwner) return null;

    return (
        // 管理者向けの簡単なフォーム
        <div className="space-y-2">
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <input
                className="w-full text-black p-1"
                placeholder="CID"
                value={cid}
                onChange={(e) => setCid(e.target.value)}
            />
            <button className="btn" onClick={updateCid}>CID 更新</button>
        </div>
    );
}
