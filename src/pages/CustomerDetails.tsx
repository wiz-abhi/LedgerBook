import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

interface Customer {
  id: string;
  name: string;
  village_name: string;
  contact_number?: string;
  outstanding_dues: string;
}

interface Transaction {
  id: string;
  customer_id: string;
  amount: string;
  type: 'DEBIT' | 'CREDIT';
  description: string;
  created_at: string;
}

export default function CustomerDetails() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    type: 'DEBIT' as 'DEBIT' | 'CREDIT',
    amount: '',
    description: '',
  });

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  async function fetchCustomerDetails() {
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    const { data: transactionData } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (customerData) setCustomer(customerData);
    if (transactionData) setTransactions(transactionData);
  }

  async function handleTransaction(e: React.FormEvent) {
    e.preventDefault();
    
    const amount = parseFloat(transactionForm.amount);
    if (isNaN(amount)) return;

    const transactionAmount = transactionForm.type === 'DEBIT' ? amount : -amount;
    let duesAdjustment = transactionAmount;

    if (editingTransaction) {
      duesAdjustment = transactionAmount - parseFloat(editingTransaction.amount);
      
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({
          amount: transactionAmount,
          type: transactionForm.type,
          description: transactionForm.description || 'N/A',
        })
        .eq('id', editingTransaction.id);

      if (!transactionError) {
        await updateCustomerDues(parseFloat(customer!.outstanding_dues) + duesAdjustment);
      }
    } else {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          customer_id: id,
          amount: transactionAmount,
          type: transactionForm.type,
          description: transactionForm.description || 'N/A',
        }]);

      if (!transactionError) {
        await updateCustomerDues(parseFloat(customer!.outstanding_dues) + transactionAmount);
      }
    }
  }

  async function deleteTransaction(transaction: Transaction) {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transaction.id);

    if (!error) {
      const newDues = parseFloat(customer!.outstanding_dues) - parseFloat(transaction.amount);
      await updateCustomerDues(newDues);
    }
  }

  async function updateCustomerDues(newDues: number) {
    const { error: customerError } = await supabase
      .from('customers')
      .update({ outstanding_dues: newDues })
      .eq('id', id);

    if (!customerError) {
      setShowModal(false);
      setEditingTransaction(null);
      setTransactionForm({ type: 'DEBIT', amount: '', description: '' });
      fetchCustomerDetails();
    }
  }

  function handleEditClick(transaction: Transaction) {
    setTransactionForm({
      type: transaction.type,
      amount: Math.abs(parseFloat(transaction.amount)).toString(),
      description: transaction.description,
    });
    setEditingTransaction(transaction);
    setShowModal(true);
  }
  function generateExcelReport() {
    if (!customer) return;
  
    const excelData = transactions.map(t => ({
      Date: new Date(t.created_at).toLocaleDateString(),
      Description: t.description || '-',
      Type: t.type,
      Amount: `₹${Math.abs(parseFloat(t.amount)).toFixed(2)}`,
    }));
  
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
  
    XLSX.utils.book_append_sheet(wb, ws, `${customer.name} - Transactions`);
    XLSX.writeFile(wb, `${customer.name}_transactions.xlsx`);
  }


  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex items-center">
          <Link
            to="/customers"
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Customers
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Customer Details
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{customer.name}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Village</dt>
                <dd className="mt-1 text-sm text-gray-900">{customer.village_name}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Contact Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{customer.contact_number || '-'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Outstanding Dues</dt>
                <dd className="mt-1 text-sm text-gray-900">₹{parseFloat(customer.outstanding_dues).toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
        {/* Existing header and customer details sections remain unchanged */}
        
        <div className="mt-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
            </div>
            <div className="flex justify-between items-center mt-4 sm:mt-0 sm:ml-16 sm:justify-end sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={() => {
                  setTransactionForm({ type: 'DEBIT', amount: '', description: '' });
                  setEditingTransaction(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Debit
              </button>
    <button
      onClick={generateExcelReport}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
    >
      Export Excel
    </button>
              <button
                onClick={() => {
                  setTransactionForm({ type: 'CREDIT', amount: '', description: '' });
                  setEditingTransaction(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Credit
              </button>
            </div>
          </div>
          
          {/* Transactions table */}
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {transaction.description || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                transaction.type === 'CREDIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {transaction.type}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ₹{Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <button
                              onClick={() => handleEditClick(transaction)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(transaction)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleTransaction}>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                  </h3>
                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        Amount
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          step="0.01"
                          id="amount"
                          required
                          value={transactionForm.amount}
                          onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                          className="shadow-sm focus:ring-indigo-500 h-8 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description (Optional)
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="description"
                          value={transactionForm.description}
                          onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block h-8 w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTransaction(null);
                    }}
                    className="inline-flex justify-center w-full rounded-md border border-transparent bg-gray-300 py-2 px-4 text-base font-medium text-gray-700 hover:bg-gray-200 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center w-full rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-base font-medium text-white hover:bg-indigo-700 sm:w-auto sm:text-sm"
                  >
                    {editingTransaction ? 'Save Changes' : 'Add Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}