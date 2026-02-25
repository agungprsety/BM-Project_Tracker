import { useState } from 'react';
import type { BoQItem } from '@/types';
import { generateId } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface BoQProps {
  projectId: string;
  boq: BoQItem[];
  onUpdate: (boq: BoQItem[]) => void;
  darkMode?: boolean;
  readonly?: boolean;
}

export default function BoQ({ projectId, boq = [], onUpdate, darkMode = false, readonly = false }: BoQProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    itemNumber: '',
    description: '',
    unit: '',
    quantity: '',
    unitPrice: '',
  });

  const handleAddItem = () => {
    if (!newItem.itemNumber || !newItem.description || !newItem.unit || !newItem.quantity || !newItem.unitPrice) {
      return;
    }

    const item: BoQItem = {
      id: generateId(),
      itemNumber: newItem.itemNumber,
      description: newItem.description,
      unit: newItem.unit,
      quantity: Number(newItem.quantity),
      unitPrice: Number(newItem.unitPrice),
    };

    onUpdate([...boq, item]);
    setNewItem({ itemNumber: '', description: '', unit: '', quantity: '', unitPrice: '' });
    setIsAdding(false);
  };

  const handleDeleteItem = (id: string) => {
    onUpdate(boq.filter((item) => item.id !== id));
  };

  const totalValue = boq.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <Card darkMode={darkMode}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Bill of Quantities (BoQ)</h3>
        {!readonly && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            Add Item
          </Button>
        )}
      </div>

      {boq.length === 0 && !isAdding ? (
        <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No BoQ items yet. Add items to define the contract scope.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500'}>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Unit</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  {!readonly && <th className="px-3 py-2"></th>}
                </tr>
              </thead>
              <tbody>
                {boq.map((item) => (
                  <tr key={item.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="px-3 py-2">{item.itemNumber}</td>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-right">{item.unit}</td>
                    <td className="px-3 py-2 text-right">{item.quantity.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-2 text-right">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-2 text-right font-medium">Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}</td>
                    {!readonly && (
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
            <div>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Contract Value: </span>
              <span className="font-bold text-blue-600">Rp {totalValue.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </>
      )}

      {isAdding && !readonly && (
        <div className={`mt-4 p-4 rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
          <h4 className="font-semibold mb-3">Add New BoQ Item</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Input
              placeholder="Item #"
              value={newItem.itemNumber}
              onChange={(e) => setNewItem({ ...newItem, itemNumber: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="col-span-2"
            />
            <Input
              placeholder="Unit (e.g. m³, ton)"
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Contract Qty"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Unit Price (Rp)"
              value={newItem.unitPrice}
              onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleAddItem}>Save</Button>
            <Button size="sm" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
