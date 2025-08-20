'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PricingTier {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  customerType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Fees {
  extraLuggageFee: number;
  petFee: number;
}

export default function AdminPricingPage() {
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [fees, setFees] = useState<Fees>({ extraLuggageFee: 5, petFee: 10 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const customerTypes = ['REGULAR', 'STUDENT', 'MILITARY', 'LEGACY'];

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/admin/pricing', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch pricing');
      
      const data = await response.json();
      setPricingTiers(data.pricingTiers);
      setFees(data.fees);
    } catch (err) {
      setError('Failed to load pricing data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateFees = async (newFees: Partial<Fees>) => {
    setSaving(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newFees)
      });
      
      if (!response.ok) throw new Error('Failed to update fees');
      
      setFees(prev => ({ ...prev, ...newFees }));
      setSuccess('Fees updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update fees');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const savePricingTier = async (tierData: Partial<PricingTier>) => {
    setSaving(true);
    setError('');
    
    try {
      const url = editingTier ? `/api/admin/pricing/${editingTier.id}` : '/api/admin/pricing';
      const method = editingTier ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(tierData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save pricing tier');
      }
      
      await fetchPricing();
      setEditingTier(null);
      setIsCreating(false);
      setSuccess(`Pricing tier ${editingTier ? 'updated' : 'created'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deletePricingTier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing tier?')) return;
    
    setSaving(true);
    setError('');
    
    try {
      const response = await fetch(`/api/admin/pricing/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete pricing tier');
      }
      
      await fetchPricing();
      setSuccess('Pricing tier deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 Pricing Management</h1>
        <p className="text-gray-600">Manage ticket prices and additional fees</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Additional Fees Section */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Additional Fees</h2>
          <p className="text-gray-600 mt-1">Set fees for extra luggage and pets</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extra Luggage Fee (per bag)
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={fees.extraLuggageFee}
                onChange={(e) => setFees(prev => ({ ...prev, extraLuggageFee: parseFloat(e.target.value) || 0 }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => updateFees({ extraLuggageFee: fees.extraLuggageFee })}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pet Fee (per pet)
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={fees.petFee}
                onChange={(e) => setFees(prev => ({ ...prev, petFee: parseFloat(e.target.value) || 0 }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => updateFees({ petFee: fees.petFee })}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ticket Prices by Customer Type</h2>
            <p className="text-gray-600 mt-1">Base ticket prices for different customer categories</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            + Add New Price
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pricingTiers.map((tier) => (
                <tr key={tier.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{tier.customerType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-semibold text-green-600">${tier.basePrice}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{tier.description || 'No description'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tier.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => setEditingTier(tier)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePricingTier(tier.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {(editingTier || isCreating) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTier ? 'Edit Pricing Tier' : 'Create New Pricing Tier'}
              </h3>
              
              <PricingTierForm
                tier={editingTier}
                customerTypes={customerTypes}
                onSave={savePricingTier}
                onCancel={() => {
                  setEditingTier(null);
                  setIsCreating(false);
                }}
                saving={saving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PricingTierForm({ 
  tier, 
  customerTypes, 
  onSave, 
  onCancel, 
  saving 
}: { 
  tier: PricingTier | null;
  customerTypes: string[];
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: tier?.name || '',
    description: tier?.description || '',
    basePrice: tier?.basePrice || 35,
    customerType: tier?.customerType || 'REGULAR',
    isActive: tier?.isActive !== false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Customer Type
        </label>
        <select
          value={formData.customerType}
          onChange={(e) => setFormData(prev => ({ ...prev, customerType: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {customerTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Base Price ($)
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.basePrice}
          onChange={(e) => setFormData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
          Active
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}