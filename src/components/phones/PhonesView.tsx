'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Smartphone, X, Trash2, Search, Tags } from 'lucide-react';
import { usePhones } from '../../lib/phones/storage';
import { Department, Phone, PhoneDraft } from '../../lib/phones/types';
import { numberMatchesQuery } from '../../lib/phones/search';
import { PhoneCard } from './PhoneCard';
import { PhoneFormModal } from './PhoneFormModal';

const NO_DEPARTMENT = '__none__';
const ALL = '__all__';

export const PhonesView: React.FC = () => {
  const { phones, departments, loaded, addPhone, updatePhone, removePhone, addDepartment, removeDepartment } =
    usePhones();
  const [editing, setEditing] = useState<Phone | 'new' | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Phone | null>(null);
  const [pendingDeleteDepartment, setPendingDeleteDepartment] = useState<Department | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>(ALL);
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const departmentById = useMemo(() => {
    const map = new Map<string, Department>();
    departments.forEach((d) => map.set(d.id, d));
    return map;
  }, [departments]);

  const filteredPhones = useMemo(() => {
    if (!searchQuery.trim()) return phones;
    return phones.filter((p) => p.chips.some((c) => numberMatchesQuery(c.number, searchQuery)));
  }, [phones, searchQuery]);

  const hasUnassigned = filteredPhones.some((p) => !p.departmentId || !departmentById.has(p.departmentId));

  const groups = useMemo(() => {
    const map = new Map<string, Phone[]>();
    departments.forEach((d) => map.set(d.id, []));
    map.set(NO_DEPARTMENT, []);
    filteredPhones.forEach((p) => {
      const key = p.departmentId && departmentById.has(p.departmentId) ? p.departmentId : NO_DEPARTMENT;
      map.get(key)!.push(p);
    });
    return map;
  }, [filteredPhones, departments, departmentById]);

  const visibleGroups: { key: string; label: string; items: Phone[] }[] =
    activeFilter === ALL
      ? [
          ...departments.map((d) => ({ key: d.id, label: d.name, items: groups.get(d.id) ?? [] })),
          { key: NO_DEPARTMENT, label: 'Sem departamento', items: groups.get(NO_DEPARTMENT) ?? [] },
        ].filter((g) => g.items.length > 0)
      : [
          {
            key: activeFilter,
            label: activeFilter === NO_DEPARTMENT ? 'Sem departamento' : departmentById.get(activeFilter)?.name ?? '',
            items: groups.get(activeFilter) ?? [],
          },
        ];

  const handleSubmit = (draft: PhoneDraft) => {
    if (editing && editing !== 'new') {
      updatePhone(editing.id, draft);
    } else {
      addPhone(draft);
    }
    setEditing(null);
  };

  const handleCreateDepartment = async () => {
    const created = await addDepartment(newDepartmentName);
    if (created) {
      setNewDepartmentName('');
      setCreatingDepartment(false);
      setActiveFilter(created.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-slate-900 flex items-center gap-2.5">
            <Smartphone className="w-7 h-7 text-blue-600" />
            Gestão de Celulares
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre os aparelhos, seus chips e a atribuição de WhatsApp Normal e Business.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/etiquetas"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Tags className="w-4 h-4" />
            Gerar etiquetas
          </Link>
          <button
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Adicionar celular
          </button>
        </div>
      </div>

      <div className="relative mt-4 mb-6 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="tel"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por número (ex: só os 4 últimos dígitos)"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        {departments.length > 0 && (
          <button
            onClick={() => setActiveFilter(ALL)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              activeFilter === ALL
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos
          </button>
        )}

        {departments.map((d) => (
            <div key={d.id} className="group relative">
              <button
                onClick={() => setActiveFilter(d.id)}
                className={`pl-3 pr-2 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === d.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {d.name}
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDeleteDepartment(d);
                  }}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-0.5 ${
                    activeFilter === d.id ? 'hover:bg-blue-700' : 'hover:bg-slate-200'
                  }`}
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            </div>
          ))}

        {hasUnassigned && (
          <button
            onClick={() => setActiveFilter(NO_DEPARTMENT)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              activeFilter === NO_DEPARTMENT
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sem departamento
          </button>
        )}

        {creatingDepartment ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateDepartment();
                } else if (e.key === 'Escape') {
                  setCreatingDepartment(false);
                  setNewDepartmentName('');
                }
              }}
              placeholder="Nome do departamento"
              className="px-3 py-1.5 rounded-full text-xs border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            <button
              onClick={handleCreateDepartment}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              Criar
            </button>
            <button
              onClick={() => {
                setCreatingDepartment(false);
                setNewDepartmentName('');
              }}
              className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingDepartment(true)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Departamento
          </button>
        )}
      </div>

      {!loaded ? null : phones.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200">
          <Smartphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Nenhum celular cadastrado ainda.</p>
          <button
            onClick={() => setEditing('new')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Cadastrar o primeiro
          </button>
        </div>
      ) : filteredPhones.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Nenhum número encontrado para &quot;{searchQuery}&quot;.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {visibleGroups.map((group) => (
            <div key={group.key}>
              {activeFilter === ALL && departments.length > 0 && (
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  {group.label} <span className="font-normal text-slate-300">({group.items.length})</span>
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.items.map((phone) => (
                  <PhoneCard
                    key={phone.id}
                    phone={phone}
                    departmentName={phone.departmentId ? departmentById.get(phone.departmentId)?.name : undefined}
                    searchQuery={searchQuery}
                    onEdit={() => setEditing(phone)}
                    onDelete={() => setPendingDelete(phone)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <PhoneFormModal
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? undefined : editing}
          departments={departments}
          onCreateDepartment={addDepartment}
          onClose={() => setEditing(null)}
          onSubmit={handleSubmit}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={() => setPendingDelete(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Excluir celular?</h3>
            <p className="text-sm text-slate-500">
              Tem certeza que deseja excluir <span className="font-medium text-slate-700">{pendingDelete.name}</span>? Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  removePhone(pendingDelete.id);
                  setPendingDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={() => setPendingDeleteDepartment(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              Excluir departamento?
            </h3>
            <p className="text-sm text-slate-500">
              Tem certeza que deseja excluir <span className="font-medium text-slate-700">{pendingDeleteDepartment.name}</span>?
              Os celulares desse departamento passam para &quot;Sem departamento&quot;.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPendingDeleteDepartment(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (activeFilter === pendingDeleteDepartment.id) setActiveFilter(ALL);
                  removeDepartment(pendingDeleteDepartment.id);
                  setPendingDeleteDepartment(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
