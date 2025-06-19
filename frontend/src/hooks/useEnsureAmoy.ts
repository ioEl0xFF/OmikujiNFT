// hooks/useEnsureAmoy.ts
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

export function useEnsureAmoy() {
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const AMOY_ID = 80002;

    const ensure = async () => {
        if (chainId !== AMOY_ID) {
            await switchChain({ chainId: AMOY_ID });
        }
    };

    return { ensure };
}
