import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import queryString from 'query-string';
import { CustomerFormModal } from '../components/CustomerFormModal';
import * as XLSX from 'xlsx';

type Customer = {
  id: string;
  name: string;
  village_name: string;
  contact_number: string | null;
  outstanding_dues: string;
};

type CustomerFormData = {
  name: string;
  village_name: string;
  contact_number: string;
};

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    village_name: '',
    contact_number: '',
  });
  
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order(sortBy);
    if (data) setCustomers(data);
  }, [sortBy]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const { village_name } = queryString.parse(location.search);
    if (village_name) setSearch(village_name as string);
  }, [location.search]);

  function handleEdit(customer: Customer, e: React.MouseEvent) {
    e.stopPropagation();
    setIsEditing(true);
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      village_name: customer.village_name,
      contact_number: customer.contact_number || '',
    });
    setShowModal(true);
  }

  async function handleDelete(customerId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this customer?')) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .match({ id: customerId });

      if (!error) {
        fetchCustomers();
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (isEditing && selectedCustomer) {
      const { error } = await supabase
        .from('customers')
        .update(formData)
        .match({ id: selectedCustomer.id });

      if (!error) {
        setShowModal(false);
        fetchCustomers();
      }
    } else {
      const { error } = await supabase
        .from('customers')
        .insert([{ ...formData, user_id: user.id }]);

      if (!error) {
        setShowModal(false);
        fetchCustomers();
      }
    }
    
    resetForm();
  }

  function resetForm() {
    setFormData({ name: '', village_name: '', contact_number: '' });
    setIsEditing(false);
    setSelectedCustomer(null);
    setShowModal(false);
  }

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.village_name.toLowerCase().includes(search.toLowerCase())
  );

  async function exportMasterData() {
    const { data: customersData } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        village_name,
        contact_number,
        outstanding_dues,
        transactions (
          amount,
          type,
          description,
          created_at
        )
      `);

    if (!customersData) return;

    const customerSummary = customersData.map(customer => ({
      'Customer Name': customer.name,
      'Village': customer.village_name,
      'Contact': customer.contact_number || '-',
      'Outstanding Dues': `₹${parseFloat(customer.outstanding_dues).toFixed(2)}`,
    }));

    const transactionDetails = customersData.flatMap(customer => 
      (customer.transactions || []).map(transaction => ({
        'Customer Name': customer.name,
        'Village': customer.village_name,
        'Date': new Date(transaction.created_at).toLocaleDateString(),
        'Type': transaction.type,
        'Amount': `₹${Math.abs(parseFloat(transaction.amount)).toFixed(2)}`,
        'Description': transaction.description || '-',
      }))
    );

    const wb = XLSX.utils.book_new();
    
    const wsSummary = XLSX.utils.json_to_sheet(customerSummary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Customer Summary');
    
    const wsTransactions = XLSX.utils.json_to_sheet(transactionDetails);
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transaction Details');

    XLSX.writeFile(wb, `customer_master_data_${new Date().toLocaleDateString()}.xlsx`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Customers
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={exportMasterData}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Master Data
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block h-10 w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search customers..."
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="name">Sort by Name</option>
                <option value="village_name">Sort by Village</option>
                <option value="outstanding_dues">Sort by Dues</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Village
                        </th>
                        <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dues
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => window.location.href = `/customers/${customer.id}`}
                        >
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {customer.village_name}
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {customer.contact_number || '-'}
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ₹{parseFloat(customer.outstanding_dues).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => handleEdit(customer, e)}
                              className="text-indigo-600 hover:text-indigo-900 mr-2 sm:mr-4"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(customer.id, e)}
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

      <CustomerFormModal
        showModal={showModal}
        isEditing={isEditing}
        formData={formData}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        onFormDataChange={(data) => setFormData({ ...formData, ...data })}
      />
    </div>
  );
}