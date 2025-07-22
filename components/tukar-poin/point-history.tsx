'use client';

import { useUserStore } from '@/lib/store/user-store';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useCallback } from 'react';

type Transaction = {
  id: string;
  created_at: string;
  amount: number;
  type: 'in' | 'out';
};

export const PointHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
  const [loading, setLoading] = useState(false);
  const user = useUserStore((state) => state.user);
  const supabase = createClient();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('type', filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  }, [supabase, user?.id, filter]);
  
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Riwayat Poin</h2>
        <select
          className="border rounded px-2 py-1"
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'in' | 'out')}
        >
          <option value="all">Semua</option>
          <option value="in">Masuk</option>
          <option value="out">Keluar</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : transactions.length === 0 ? (
        <p>Tidak ada data transaksi.</p>
      ) : (
        <ul className="space-y-2">
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className="border p-3 rounded-md flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  {tx.type === 'in' ? 'Poin Masuk' : 'Poin Keluar'}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(tx.created_at).toLocaleString()}
                </p>
              </div>
              <div
                className={`text-lg font-bold ${
                  tx.type === 'in' ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {tx.type === 'in' ? '+' : '-'}
                {tx.amount}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
