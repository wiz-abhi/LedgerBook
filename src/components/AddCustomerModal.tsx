import React from 'react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  onSubmitSuccess: () => void; // Callback to refresh data or show success message
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  initialName,
  onSubmitSuccess,
}) => {
  const [formData, setFormData] = React.useState({
    name: initialName,
    villageName: '',
    contactNumber: '',
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({ ...prev, name: initialName }));
      setErrorMessage('');
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          villageName: formData.villageName,
          contactNumber: formData.contactNumber || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add customer: ${response.statusText}`);
      }

      // Reset the form and call success callback
      setFormData({ name: '', villageName: '', contactNumber: '' });
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding customer:', error);
      setErrorMessage('Failed to add customer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Add New Customer</h3>

        {errorMessage && (
          <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Village Name *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.villageName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, villageName: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Contact Number (Optional)
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.contactNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contactNumber: e.target.value,
                }))
              }
              placeholder="Enter contact number"
              pattern="[0-9]*"
            />
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!formData.name || !formData.villageName || isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;
