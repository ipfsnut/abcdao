'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { config } from '@/lib/config';

interface TransactionValidatorProps {
  onValidationSuccess?: () => void;
}

export function TransactionValidator({ onValidationSuccess }: TransactionValidatorProps) {
  const { user: profile } = useFarcaster();
  const [txHash, setTxHash] = useState('');
  const [validating, setValidating] = useState(false);

  const handleValidateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.fid || !txHash) return;

    // Basic tx hash validation
    if (!txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      toast.error('Invalid transaction hash format');
      return;
    }

    setValidating(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/auth/validate-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_hash: txHash,
          farcaster_fid: profile.fid,
          farcaster_username: profile.username
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Transaction validated successfully!');
        setTxHash('');
        onValidationSuccess?.();
      } else {
        toast.error(data.error || 'Transaction validation failed');
      }
    } catch (error) {
      console.error('Error validating transaction:', error);
      toast.error('Failed to validate transaction');
    }
    setValidating(false);
  };

  if (!profile) {
    return (
      <div className="bg-black/40 border border-yellow-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <p className="text-yellow-400 font-mono text-center">
          Connect Farcaster to validate transactions
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-blue-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <h3 className="text-lg font-bold mb-3 text-blue-400 font-mono">
        {'>'} validate_transaction()
      </h3>
      
      <div className="mb-4 p-3 bg-blue-950/20 border border-blue-700/50 rounded-lg">
        <p className="text-blue-400 font-mono text-sm mb-2">Transaction Validation Process:</p>
        <ul className="text-blue-300 font-mono text-xs space-y-1">
          <li>→ Enter your transaction hash from membership payment</li>
          <li>→ System verifies 0.002 ETH payment to bot wallet</li>
          <li>→ Creates your ABC DAO membership automatically</li>
          <li>→ Links your Farcaster account for rewards</li>
        </ul>
      </div>

      <form onSubmit={handleValidateTransaction} className="space-y-4">
        <div>
          <label className="block text-blue-600 font-mono text-sm mb-2">
            Transaction Hash *
          </label>
          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x1234567890abcdef..."
            className="w-full bg-black/60 border border-blue-700/50 rounded-lg px-3 py-2 text-blue-400 font-mono text-sm focus:border-blue-500 focus:outline-none"
            required
          />
          <p className="text-blue-600/70 font-mono text-xs mt-1">
            Ethereum transaction hash (0x followed by 64 characters)
          </p>
        </div>

        <div className="p-3 bg-green-950/20 border border-green-700/50 rounded-lg">
          <p className="text-green-400 font-mono text-xs mb-1">✓ Expected Payment Details:</p>
          <p className="text-green-300 font-mono text-xs">Amount: 0.002 ETH</p>
          <p className="text-green-300 font-mono text-xs">To: {config.botWalletAddress || 'Bot wallet address'}</p>
        </div>

        <button
          type="submit"
          disabled={validating || !txHash}
          className="w-full bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 font-mono py-2 rounded-lg border border-blue-700/50 transition-all duration-300 hover:matrix-glow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {validating ? '// Validating...' : 'VALIDATE TRANSACTION'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-yellow-950/20 border border-yellow-700/50 rounded-lg">
        <p className="text-yellow-400 font-mono text-xs">
          ⚠ Note: Validation may take a few moments for recent transactions
        </p>
      </div>
    </div>
  );
}