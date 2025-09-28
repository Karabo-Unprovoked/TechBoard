import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryAlertProps {
  inventory: InventoryItem[];
}

export const InventoryAlert: React.FC<InventoryAlertProps> = ({ inventory }) => {
  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock);
  
  if (lowStockItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="text-green-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Inventory Status</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-green-100 mb-3">
            <Package size={48} className="mx-auto text-green-500" />
          </div>
          <p className="text-gray-600">All items are in stock</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="text-orange-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
          {lowStockItems.length} items
        </span>
      </div>
      
      <div className="space-y-3">
        {lowStockItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div>
              <p className="font-medium text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-600">{item.category} • {item.supplier}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-orange-600">
                {item.quantity} / {item.minStock} min
              </p>
              <p className="text-xs text-gray-500">${item.cost} each</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium">
        Reorder Items
      </button>
    </div>
  );
};