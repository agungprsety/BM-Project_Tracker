import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../utils';

const BoQ = React.memo(({ project, onUpdate, darkMode }) => {
  const [items, setItems] = useState(project.boq || []);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: '',
    unit: '',
    unitPrice: ''
  });

  // Calculate totals
  const totalValue = useMemo(() => 
    items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
    [items]
  );

  const completedValue = useMemo(() => 
    items.reduce((sum, item) => {
      const completedQty = item.completed || 0;
      return sum + (completedQty * item.unitPrice);
    }, 0),
    [items]
  );

  const saveBoQ = useCallback(async (boqItems) => {
    const updatedProject = {
      ...project,
      boq: boqItems,
      contractPrice: boqItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toString(),
      updatedAt: new Date().toISOString()
    };
    
    await window.storage.set('project:' + updatedProject.id, JSON.stringify(updatedProject));
    if (onUpdate) onUpdate();
  }, [project, onUpdate]);

  const addItem = useCallback(() => {
    if (!newItem.description || !newItem.quantity || !newItem.unit || !newItem.unitPrice) {
      alert('Please fill all fields');
      return;
    }

    const item = {
      id: Date.now().toString(),
      description: newItem.description,
      quantity: Number(newItem.quantity),
      unit: newItem.unit,
      unitPrice: Number(newItem.unitPrice),
      total: Number(newItem.quantity) * Number(newItem.unitPrice),
      completed: 0
    };

    const updatedItems = [...items, item];
    setItems(updatedItems);
    setNewItem({ description: '', quantity: '', unit: '', unitPrice: '' });
    saveBoQ(updatedItems);
  }, [items, newItem, saveBoQ]);

  const deleteItem = useCallback((id) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveBoQ(updatedItems);
  }, [items, saveBoQ]);

  const updateUnitPrice = useCallback((id, unitPrice) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          unitPrice: Number(unitPrice),
          total: item.quantity * Number(unitPrice)
        };
      }
      return item;
    });
    setItems(updatedItems);
    saveBoQ(updatedItems);
  }, [items, saveBoQ]);

  const updateQuantity = useCallback((id, quantity) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: Number(quantity),
          total: Number(quantity) * item.unitPrice
        };
      }
      return item;
    });
    setItems(updatedItems);
    saveBoQ(updatedItems);
  }, [items, saveBoQ]);

  const handleDescriptionChange = useCallback((e) => 
    setNewItem(prev => ({ ...prev, description: e.target.value })), []);
  
  const handleQuantityChange = useCallback((e) => 
    setNewItem(prev => ({ ...prev, quantity: e.target.value })), []);
  
  const handleUnitChange = useCallback((e) => 
    setNewItem(prev => ({ ...prev, unit: e.target.value })), []);
  
  const handleUnitPriceChange = useCallback((e) => 
    setNewItem(prev => ({ ...prev, unitPrice: e.target.value })), []);

  const bgClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800';
  const inputClass = darkMode 
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
    : 'border-gray-300 text-gray-700 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500';
  const tableHeaderClass = darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500';
  const tableRowClass = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  return (
    <div className={`rounded-xl shadow-lg p-6 mb-6 ${bgClass}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">Bill of Quantities (BoQ)</h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Contract Value: <span className="font-bold text-blue-600">{formatCurrency(totalValue)}</span>
            {totalValue > 0 && (
              <span className="ml-4">
                Completed Value: <span className="font-bold text-green-600">{formatCurrency(completedValue)}</span>
                <span className={darkMode ? 'text-gray-500 ml-2' : 'text-gray-500 ml-2'}>
                  ({totalValue > 0 ? ((completedValue / totalValue) * 100).toFixed(1) : 0}%)
                </span>
              </span>
            )}
          </p>
        </div>
        <button
          onClick={addItem}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Add Item Form */}
      <div className={`grid grid-cols-1 md:grid-cols-5 gap-3 mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <input
          type="text"
          placeholder="Description (e.g., Asphalt)"
          value={newItem.description}
          onChange={handleDescriptionChange}
          className={`px-3 py-2 border rounded-md text-sm focus:ring-2 focus:border-blue-500 ${inputClass}`}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={newItem.quantity}
          onChange={handleQuantityChange}
          className={`px-3 py-2 border rounded-md text-sm focus:ring-2 focus:border-blue-500 ${inputClass}`}
          min="0"
          step="0.01"
        />
        <input
          type="text"
          placeholder="Unit (ton, m³, etc)"
          value={newItem.unit}
          onChange={handleUnitChange}
          className={`px-3 py-2 border rounded-md text-sm focus:ring-2 focus:border-blue-500 ${inputClass}`}
        />
        <input
          type="number"
          placeholder="Unit Price"
          value={newItem.unitPrice}
          onChange={handleUnitPriceChange}
          className={`px-3 py-2 border rounded-md text-sm focus:ring-2 focus:border-blue-500 ${inputClass}`}
          min="0"
          step="1000"
        />
        <button
          onClick={addItem}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
        >
          Add to BoQ
        </button>
      </div>

      {/* BoQ Table */}
      {items.length === 0 ? (
        <div className={`text-center py-12 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className={darkMode ? 'text-gray-500 mb-4' : 'text-gray-400 mb-4'}>
            <BarChart3 size={48} className="mx-auto" />
          </div>
          <h4 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No BoQ Items Yet</h4>
          <p className={darkMode ? 'text-gray-500 mb-4' : 'text-gray-500 mb-4'}>Add your first BoQ item to start tracking progress</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={tableHeaderClass}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Completed</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Remaining</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {items.map(item => {
                const itemTotal = item.quantity * item.unitPrice;
                const completedQty = item.completed || 0;
                const remainingQty = item.quantity - completedQty;
                const progressPercentage = item.quantity > 0 ? (completedQty / item.quantity) * 100 : 0;
                
                return (
                  <tr key={item.id} className={tableRowClass}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                        className={`w-24 px-2 py-1 border rounded text-sm ${inputClass}`}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateUnitPrice(item.id, e.target.value)}
                        className={`w-32 px-2 py-1 border rounded text-sm ${inputClass}`}
                        min="0"
                        step="1000"
                      />
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-600">{formatCurrency(itemTotal)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={darkMode ? 'text-green-400' : 'text-green-600'}>{completedQty.toLocaleString()}</span>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{item.unit}</span>
                      </div>
                      <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {progressPercentage.toFixed(1)}% complete
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={darkMode ? 'text-amber-400' : 'text-amber-600'}>{remainingQty.toLocaleString()}</span>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{item.unit}</span>
                      </div>
                      <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {((remainingQty / item.quantity) * 100).toFixed(1)}% remaining
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className={tableHeaderClass}>
              <tr>
                <td colSpan="3" className="px-4 py-3 text-right font-bold">TOTAL CONTRACT VALUE:</td>
                <td colSpan="2" className="px-4 py-3">
                  <span className="text-blue-600 font-bold">{formatCurrency(totalValue)}</span>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    Completed Value: {formatCurrency(completedValue)} ({totalValue > 0 ? ((completedValue / totalValue) * 100).toFixed(1) : 0}%)
                  </div>
                </td>
                <td colSpan="2" className="px-4 py-3">
                  <div className={`text-sm ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                    Remaining Value: {formatCurrency(totalValue - completedValue)}
                  </div>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
});

BoQ.displayName = 'BoQ';

export default BoQ;
