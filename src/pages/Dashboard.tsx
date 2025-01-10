import React from 'react';
import { Link } from 'react-router-dom';
import { Users, IndianRupee, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Transaction {
  id?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  created_at: string;
  customers: {
    name: string;
    village_name: string;
  };
}

interface Customer {
  id: string;
  name: string;
  village_name: string;
  outstanding_dues: number;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'CREDIT' | 'DEBIT';
  onSubmit: (data: {
    customerId: string;
    amount: number;
    description: string;
    type: 'CREDIT' | 'DEBIT';
  }) => Promise<void>;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  onSubmit 
}) => {
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, name, village_name, outstanding_dues');
      setCustomers(data || []);
    };
    
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.village_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !amount) return;

    // CREDIT decreases dues (negative), DEBIT increases dues (positive)
    await onSubmit({
      customerId: selectedCustomer.id,
      amount: type === 'CREDIT' ? -parseFloat(amount) : parseFloat(amount),
      description,
      type
    });

    setAmount('');
    setDescription('');
    setSelectedCustomer(null);
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">
          New {type.toLowerCase()} Transaction
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Customer</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${
                      selectedCustomer?.id === customer.id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    {customer.name} ({customer.village_name})
                  </div>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="mt-2 p-2 bg-gray-100 rounded-md">
                Selected: {selectedCustomer.name} ({selectedCustomer.village_name})
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount (₹)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded-md ${
                type === 'CREDIT' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Submit {type.toLowerCase()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = React.useState({
    totalCustomers: 0,
    totalDues: 0,
    recentTransactions: [] as Transaction[],
  });
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [transactionType, setTransactionType] = React.useState<'CREDIT' | 'DEBIT'>('CREDIT');

  async function fetchStats() {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, outstanding_dues');

    const { data: transactions } = await supabase
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

    const typedTransactions = (transactions || []).map((transaction) => ({
      id: transaction.id,
      amount: Math.abs(transaction.amount),
      type: transaction.type as 'CREDIT' | 'DEBIT',
      created_at: transaction.created_at,
      customers: {
        name: transaction.customers?.name || '',
        village_name: transaction.customers?.village_name || ''
      }
    }));

    setStats({
      totalCustomers: customers?.length || 0,
      totalDues: customers?.reduce(
        (sum, c) => sum + (parseFloat(String(c.outstanding_dues)) || 0),
        0
      ) || 0,
      recentTransactions: typedTransactions,
    });
  }

  React.useEffect(() => {
    fetchStats();
  }, []);

  const handleTransactionSubmit = async (transactionData: {
    customerId: string;
    amount: number;
    description: string;
    type: 'CREDIT' | 'DEBIT';
  }) => {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('outstanding_dues')
        .eq('id', transactionData.customerId)
        .single();

      if (!customer) throw new Error('Customer not found');

      const currentDues = parseFloat(String(customer.outstanding_dues)) || 0;
      const newDues = currentDues + transactionData.amount;

      const [transactionResponse, customerResponse] = await Promise.all([
        supabase.from('transactions').insert([{
          customer_id: transactionData.customerId,
          amount: transactionData.amount,
          description: transactionData.description,
          type: transactionData.type
        }]),
        supabase
          .from('customers')
          .update({ outstanding_dues: newDues })
          .eq('id', transactionData.customerId)
      ]);

      if (transactionResponse.error) throw transactionResponse.error;
      if (customerResponse.error) throw customerResponse.error;

      fetchStats();
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const openTransactionModal = (type: 'CREDIT' | 'DEBIT') => {
    setTransactionType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={() => openTransactionModal('CREDIT')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              title="Payment received - reduces outstanding dues"
            >
              Credit (Payment)
            </button>
            <button
              onClick={() => openTransactionModal('DEBIT')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              title="New purchase - increases outstanding dues"
            >
              Debit (Purchase)
            </button>
            <Link
              to="/customers"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Customers
            </Link>
            <Link
              to="/villages"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Villages
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

        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          type={transactionType}
          onSubmit={handleTransactionSubmit}
        />
      </div>
    </div>
  );
}