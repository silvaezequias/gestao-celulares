'use client';

import React, { useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../lib/phones/store';
import { Department } from '../../lib/phones/types';
import { ConfirmSheet, Sheet } from '../ui/Sheet';

export function DepartmentsSheet({ onClose }: { onClose: () => void }) {
  const { departments, phones, addDepartment, renameDepartment, removeDepartment } = useStore();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleting, setDeleting] = useState<Department | null>(null);

  const count = (id: string) => phones.filter((p) => p.departmentId === id).length;

  const create = async () => {
    if (!newName.trim()) return;
    await addDepartment(newName).catch(() => null);
    setNewName('');
  };

  const saveRename = async () => {
    if (editingId && editName.trim()) await renameDepartment(editingId, editName.trim()).catch(() => null);
    setEditingId(null);
  };

  return (
    <>
      <Sheet title="Departamentos" onClose={onClose}>
        <div className="flex gap-2">
          <input
            className="field"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="Novo departamento"
          />
          <button onClick={create} className="btn-primary shrink-0 px-3" aria-label="Criar departamento">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-4 divide-y divide-zinc-100 rounded-2xl ring-1 ring-zinc-200/70">
          {departments.length === 0 && <li className="p-4 text-sm text-zinc-400">Nenhum departamento ainda.</li>}
          {departments.map((d) => (
            <li key={d.id} className="flex items-center gap-2 py-1.5 pl-4 pr-1.5">
              {editingId === d.id ? (
                <>
                  <input
                    autoFocus
                    className="field h-9"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button onClick={saveRename} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-emerald-600 hover:bg-emerald-50" aria-label="Salvar nome">
                    <Check className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm font-medium text-zinc-800">{d.name}</span>
                  <span className="text-xs tabular-nums text-zinc-400">{count(d.id)}</span>
                  <button
                    onClick={() => {
                      setEditingId(d.id);
                      setEditName(d.name);
                    }}
                    className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                    aria-label={`Renomear ${d.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleting(d)}
                    className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Excluir ${d.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </Sheet>

      {deleting && (
        <ConfirmSheet
          title="Excluir departamento?"
          message={
            <>
              <strong className="font-semibold text-zinc-800">{deleting.name}</strong> será removido. Os {count(deleting.id)} celulares dele
              passam para “Sem departamento”.
            </>
          }
          onClose={() => setDeleting(null)}
          onConfirm={() => removeDepartment(deleting.id)}
        />
      )}
    </>
  );
}
