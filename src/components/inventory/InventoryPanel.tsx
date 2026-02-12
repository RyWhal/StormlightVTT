import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Package, Save, X } from 'lucide-react';
import { useCharacters } from '../../hooks/useCharacters';
import { useIsGM } from '../../stores/sessionStore';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useToast } from '../shared/Toast';
import type { InventoryItem } from '../../types';

export const InventoryPanel: React.FC = () => {
  const { showToast } = useToast();
  const isGM = useIsGM();
  const { characters, myCharacter, updateInventory } = useCharacters();

  const [editingItem, setEditingItem] = useState<{
    index: number;
    item: InventoryItem;
  } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<InventoryItem>({
    name: '',
    quantity: 1,
    notes: '',
  });

  // For GM, let them select which character to view
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    myCharacter?.id || null
  );

  const selectedCharacter = isGM
    ? characters.find((c) => c.id === selectedCharacterId)
    : myCharacter;

  const handleAddItem = async () => {
    if (!selectedCharacter || !newItem.name.trim()) return;

    const updatedInventory = [...selectedCharacter.inventory, newItem];
    const result = await updateInventory(selectedCharacter.id, updatedInventory);

    if (result.success) {
      setNewItem({ name: '', quantity: 1, notes: '' });
      setIsAdding(false);
      showToast('Item added', 'success');
    } else {
      showToast(result.error || 'Failed to add item', 'error');
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedCharacter || !editingItem) return;

    const updatedInventory = [...selectedCharacter.inventory];
    updatedInventory[editingItem.index] = editingItem.item;

    const result = await updateInventory(selectedCharacter.id, updatedInventory);

    if (result.success) {
      setEditingItem(null);
      showToast('Item updated', 'success');
    } else {
      showToast(result.error || 'Failed to update item', 'error');
    }
  };

  const handleDeleteItem = async (index: number) => {
    if (!selectedCharacter) return;

    const updatedInventory = selectedCharacter.inventory.filter(
      (_, i) => i !== index
    );

    const result = await updateInventory(selectedCharacter.id, updatedInventory);

    if (result.success) {
      showToast('Item removed', 'success');
    } else {
      showToast(result.error || 'Failed to remove item', 'error');
    }
  };

  if (!selectedCharacter && !isGM) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <Package className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">
            Claim a character to manage inventory
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Character selector (GM only) */}
      {isGM && (
        <div className="p-4 border-b border-slate-700">
          <label className="text-sm text-slate-400 mb-1 block">
            Select Character
          </label>
          <select
            value={selectedCharacterId || ''}
            onChange={(e) => setSelectedCharacterId(e.target.value || null)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100"
          >
            <option value="">Select a character...</option>
            {characters.map((char) => (
              <option key={char.id} value={char.id}>
                {char.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Header */}
      {selectedCharacter && (
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="font-medium text-slate-200">
            {selectedCharacter.name}'s Inventory
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>
      )}

      {/* Inventory list */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedCharacter ? (
          <p className="text-slate-500 text-center">Select a character</p>
        ) : selectedCharacter.inventory.length === 0 && !isAdding ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No items yet</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setIsAdding(true)}
            >
              Add your first item
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Add item form */}
            {isAdding && (
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                <h4 className="font-medium text-slate-200 mb-3">Add Item</h4>
                <div className="space-y-3">
                  <Input
                    placeholder="Item name"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem((i) => ({ ...i, name: e.target.value }))
                    }
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem((i) => ({
                          ...i,
                          quantity: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-20"
                    />
                    <Input
                      placeholder="Notes (optional)"
                      value={newItem.notes || ''}
                      onChange={(e) =>
                        setNewItem((i) => ({ ...i, notes: e.target.value }))
                      }
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsAdding(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleAddItem}
                      disabled={!newItem.name.trim()}
                      className="flex-1"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Item list */}
            {selectedCharacter.inventory.map((item, index) => (
              <div key={index}>
                {editingItem?.index === index ? (
                  // Edit mode
                  <div className="bg-slate-800 rounded-lg p-4 border border-tempest-500">
                    <div className="space-y-3">
                      <Input
                        placeholder="Item name"
                        value={editingItem.item.name}
                        onChange={(e) =>
                          setEditingItem((ei) =>
                            ei
                              ? {
                                  ...ei,
                                  item: { ...ei.item, name: e.target.value },
                                }
                              : null
                          )
                        }
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={editingItem.item.quantity}
                          onChange={(e) =>
                            setEditingItem((ei) =>
                              ei
                                ? {
                                    ...ei,
                                    item: {
                                      ...ei.item,
                                      quantity: parseInt(e.target.value) || 1,
                                    },
                                  }
                                : null
                            )
                          }
                          className="w-20"
                        />
                        <Input
                          placeholder="Notes"
                          value={editingItem.item.notes || ''}
                          onChange={(e) =>
                            setEditingItem((ei) =>
                              ei
                                ? {
                                    ...ei,
                                    item: { ...ei.item, notes: e.target.value },
                                  }
                                : null
                            )
                          }
                          className="flex-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setEditingItem(null)}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleUpdateItem}
                          className="flex-1"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">
                          {item.name}
                        </span>
                        <span className="text-sm text-slate-400">
                          x{item.quantity}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-slate-400 mt-1">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingItem({ index, item })}
                        className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(index)}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
