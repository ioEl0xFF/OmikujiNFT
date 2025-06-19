import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import OmikujiABI from '../abi/OmikujiNFT.json';
import { toast } from 'react-toastify';

const CONTRACT = '0xb321508426133033848536E1B3233cC12295A152';

export default function AdminPanel({ wallet }) {
    const [isOwner, setIsOwner] = useState(false);
    const [uris, setUris] = useState(Array(5).fill(''));

    const getReadContract = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        return new ethers.Contract(CONTRACT, OmikujiABI.abi, provider);
    };

    const getWriteContract = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(CONTRACT, OmikujiABI.abi, signer);
    };

    const loadData = useCallback(async () => {
        if (!wallet) return;
        try {
            const contract = await getReadContract();
            const owner = (await contract.owner()).toLowerCase();
            const isOwnerAddr = owner === wallet.toLowerCase();
            setIsOwner(isOwnerAddr);
            if (!isOwnerAddr) return;
            const arr = [];
            for (let i = 0; i < 5; i++) {
                arr.push(await contract.uris(i));
            }
            setUris(arr);
        } catch (e) {
            console.error('AdminPanel loadData error:', e);
            toast.error('データ取得に失敗しました');
        }
    }, [wallet]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateUris = async () => {
        if (!isOwner) return;
        try {
            const contract = await getWriteContract();
            const tx = await contract.setIpfsUris(uris);
            toast.info('更新トランザクション送信');
            await tx.wait();
            toast.success('URI 更新完了');
        } catch (e) {
            console.error('AdminPanel updateUris error:', e);
            toast.error('更新に失敗しました');
        }
    };

    if (!isOwner) return null;

    return (
        <div className="space-y-2">
            <h2 className="text-xl font-bold">Admin Panel</h2>
            {uris.map((u, i) => (
                <input
                    key={i}
                    className="w-full text-black p-1"
                    value={u}
                    onChange={(e) => {
                        const next = [...uris];
                        next[i] = e.target.value;
                        setUris(next);
                    }}
                />
            ))}
            <button className="btn" onClick={updateUris}>更新</button>
        </div>
    );
}
