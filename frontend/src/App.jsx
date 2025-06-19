// App.jsx
// -----------------------------------------------------------------------------
// アプリのルートコンポーネント。
// - MintButton: ウォレット接続 & NFT ミント
// - History   : ユーザーの NFT 保有履歴
// 余計な状態管理を避け、必要最低限のステートのみ保持しています。
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import MintButton from './components/MintButton';
import History from './components/History';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
    // ---------------------------------
    // React hooks
    // ---------------------------------
    const [wallet, setWallet] = useState(null); // 現在接続中のアカウント
    const [refresh, setRefresh] = useState(0); // History 再読み込みトリガー

    // 初回レンダー時にウォレット情報を復元し、アカウント変化も監視する
    useEffect(() => {
        // ローカルストレージに保存されていれば復元
        const stored = localStorage.getItem('wallet');
        if (stored) setWallet(stored);

        // MetaMask 側でアカウントが切り替わったら同期
        const handleChange = (acc) => {
            const a = acc?.[0];
            setWallet(a ?? null);
            // ストレージにも反映
            a ? localStorage.setItem('wallet', a) : localStorage.removeItem('wallet');
        };
        window.ethereum?.on?.('accountsChanged', handleChange);

        // コンポーネントアンマウント時にイベント解除
        return () => window.ethereum?.removeListener?.('accountsChanged', handleChange);
    }, []);

    // ---------------------------------
    // 表示 (JSX)
    // ---------------------------------
    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-3xl font-bold">Omikuji NFT</h1>

            {/* ウォレット接続 & ミント */}
            <MintButton
                onConnect={setWallet}
                onMintSuccess={() => setRefresh((v) => v + 1)} // ミント成功で履歴リロード
            />

            <hr className="my-4" />

            {/* NFT 履歴 */}
            <History wallet={wallet} refreshTrigger={refresh} />

            {/* トースト通知（画面右下） */}
            <ToastContainer position="bottom-right" theme="dark" />
        </div>
    );
}
