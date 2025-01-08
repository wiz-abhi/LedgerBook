import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';


const Villages = () => {
  const [villages, setVillages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('customers') // No type argument here
          .select('village_name')
          .neq('village_name', null);

        if (error) {
          console.error('Error fetching villages:', error);
          return;
        }

        // Ensure data is properly typed and map to unique village names
        const uniqueVillages = [
          ...new Set(data?.map((customer) => customer.village_name) ?? []),
        ];

        setVillages(uniqueVillages);
      } catch (error) {
        console.error('Error fetching villages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVillages();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500">Loading villages...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Villages
            </h2>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                List of Villages
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="flow-root">
                <ul className="divide-y divide-gray-200">
                  {villages.length > 0 ? (
                    villages.map((village, index) => (
                      <li key={index} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <Link
                            to={`/customers?village_name=${village}`}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            {village}
                          </Link>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-4 sm:px-6">
                      <p className="text-sm text-gray-500">No villages found.</p>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Villages;
