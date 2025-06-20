import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import OmikujiABI from '../abi/OmikujiNFT.json';
import { toast } from 'react-toastify';
import { CONTRACT_ADDRESS } from '../constants';

const CONTRACT = CONTRACT_ADDRESS;

export default function AdminPanel({ wallet }) {
    const [isOwner, setIsOwner] = useState(false);
    const [cid, setCid] = useState('');
    const [uris, setUris] = useState([]);

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
            console.log('AdminPanel loadData', {
                owner,
                wallet,
                isOwner: isOwnerAddr,
            });
            setIsOwner(isOwnerAddr);
            if (!isOwnerAddr) return;
            const arr = [];
            for (let i = 0; i < 5; i++) {
                arr.push(await contract.uris(i));
            }
            setUris(arr);
            if (arr[0]) {
                const tmp = arr[0].replace('ipfs://', '').split('/')[0];
                setCid(tmp);
            }
        } catch (e) {
            console.error('AdminPanel loadData error:', e);
            toast.error('データ取得に失敗しました');
        }
    }, [wallet]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateCid = async () => {
        if (!isOwner) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            const signer = await provider.getSigner();
            const userAddr = await signer.getAddress();
            const read = await getReadContract();
            const owner = await read.owner();
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
            loadData();
        } catch (e) {
            console.error('AdminPanel updateCid error:', {
                message: e?.message,
                code: e?.code,
                data: e?.data,
            });
            toast.error('更新に失敗しました');
        }
    };

    if (!isOwner) return null;

    return (
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
