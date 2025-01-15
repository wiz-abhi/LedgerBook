import React from 'react';

type CustomerFormData = {
  name: string;
  village_name: string;
  contact_number: string;
};

interface CustomerFormModalProps {
  showModal: boolean;
  isEditing: boolean;
  formData: CustomerFormData;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  onFormDataChange: (data: Partial<CustomerFormData>) => void;
}

export function CustomerFormModal({
  showModal,
  isEditing,
  formData,
  onSubmit,
  onCancel,
  onFormDataChange,
}: CustomerFormModalProps) {
  if (!showModal) return null;

  return (
    <div className="fixed z-[100] inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <form onSubmit={onSubmit}>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {isEditing ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => onFormDataChange({ name: e.target.value })}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="village" className="block text-sm font-medium text-gray-700">
                    Village Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="village"
                      id="village"
                      required
                      value={formData.village_name}
                      onChange={(e) => onFormDataChange({ village_name: e.target.value })}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                    Contact Number (Optional)
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="contact"
                      id="contact"
                      value={formData.contact_number}
                      onChange={(e) => onFormDataChange({ contact_number: e.target.value })}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                onClick={onCancel}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto"
              >
                {isEditing ? 'Save Changes' : 'Add Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 