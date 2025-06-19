import React from 'react';
import { toast } from 'react-toastify';

export const notifyTx = (hash: string) =>
    toast.info(
        <a href={`https://polygonscan.com/tx/${hash}`} target="_blank">
            🔗 トランザクション確認
        </a>,
        { autoClose: 60000 }
    );

export const notifyError = (msg: string) => toast.error(`❌ ${msg}`, { autoClose: 8000 });

export const notifySuccess = (msg: string) => toast.success(`✅ ${msg}`);
