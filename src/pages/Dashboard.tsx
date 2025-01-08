import React from 'react';
import { Link } from 'react-router-dom';
import { Users, IndianRupee, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Transaction {
  id?: string; // Optional, as we may not have this in some data
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  created_at: string;
  customers: {
    name: string;
    village_name: string;
  };
}

export default function Dashboard() {
  const [stats, setStats] = React.useState({
    totalCustomers: 0,
    totalDues: 0,
    recentTransactions: [] as Transaction[], // Ensure it's treated as Transaction[]
  });

  React.useEffect(() => {
    async function fetchStats() {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, outstanding_dues');

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          type,
          created_at,
          customers (
            name,
            village_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching transactions:', error);
      }

      // Safely cast transactions to Transaction[] if data is present
      const typedTransactions: Transaction[] = transactions
        ? transactions.map((transaction: any) => ({
            id: transaction.id,
            amount: transaction.amount,
            type: transaction.type,
            created_at: transaction.created_at,
            customers: transaction.customers,
          }))
        : [];

      setStats({
        totalCustomers: customers?.length || 0,
        totalDues:
          customers?.reduce(
            (sum, c) => sum + (parseFloat(c.outstanding_dues) || 0),
            0
          ) || 0,
        recentTransactions: typedTransactions,
      });
    }

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/customers"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Customers
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Customers
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats.totalCustomers}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <IndianRupee className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Outstanding Dues
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        ₹{stats.totalDues.toFixed(2)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Transactions
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="flow-root">
                <ul className="divide-y divide-gray-200">
                  {stats.recentTransactions.map((transaction) => (
                    <li key={transaction.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.customers.name}
                          </p>
                          <p className="ml-2 text-sm text-gray-500">
                            ({transaction.customers.village_name})
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'CREDIT'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            ₹{Math.abs(transaction.amount)}
                          </span>
                          <ArrowUpRight className="ml-2 h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
