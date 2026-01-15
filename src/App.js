import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('summary');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const result = await window.storage.list('project:');
      if (result && result.keys) {
        const data = await Promise.all(result.keys.map(async (key) => {
          try {
            const d = await window.storage.get(key);
            return d ? JSON.parse(d.value) : null;
          } catch (e) { return null; }
        }));
        setProjects(data.filter(p => p));
      }
    } catch (e) {}
  };

  const saveProject = async (proj) => {
    try {
      const p = proj.id ? proj : { ...proj, id: Date.now().toString() };
      await window.storage.set('project:' + p.id, JSON.stringify(p));
      await loadProjects();
      return p;
    } catch (e) { alert('Save failed'); }
  };

  const deleteProject = async (id) => {
    if (window.confirm('Delete?')) {
      try {
        await window.storage.delete('project:' + id);
        await loadProjects();
        setView('summary');
        setSelected(null);
      } catch (e) {}
    }
  };

  const getProgress = (p) => {
    if (!p.weeklyReports || !p.weeklyReports.length) return 0;
    return p.weeklyReports[p.weeklyReports.length - 1].cumulativeProgress || 0;
  };

  const fmt = (n) => new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR',minimumFractionDigits:0}).format(n);

  const Nav = () => (
    <div className="bg-blue-600 text-white p-4 mb-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">BM Progress Tracker</h1>
        <div className="flex gap-4">
          <button onClick={() => setView('summary')} className={'px-4 py-2 rounded ' + (view === 'summary' ? 'bg-blue-800' : 'bg-blue-500')}>Dashboard</button>
          <button onClick={() => setView('add')} className="px-4 py-2 bg-green-600 rounded">+ New</button>
        </div>
      </div>
    </div>
  );

  const ProjectForm = ({ existing, onSave, onCancel }) => {
    const [fd, setFd] = useState(existing || {name:'',contractor:'',supervisor:'',contractPrice:'',workType:'flexible-pavement',roadHierarchy:'JAS',maintenanceType:'reconstruction',startDate:'',endDate:'',boq:[],weeklyReports:[]});
    
    const submit = async () => {
      if (!fd.name || !fd.contractor || !fd.supervisor || !fd.contractPrice || !fd.startDate || !fd.endDate) {
        alert('Fill required fields');
        return;
      }
      const s = await saveProject(fd);
      if (s) onSave();
    };

    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">{existing ? 'Edit' : 'New'} Project</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={fd.name} onChange={(e) => setFd({...fd, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">Contractor</label><input type="text" value={fd.contractor} onChange={(e) => setFd({...fd, contractor: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">Supervisor</label><input type="text" value={fd.supervisor} onChange={(e) => setFd({...fd, supervisor: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">Price (IDR)</label><input type="number" value={fd.contractPrice} onChange={(e) => setFd({...fd, contractPrice: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">Work Type</label><select value={fd.workType} onChange={(e) => setFd({...fd, workType: e.target.value})} className="w-full px-3 py-2 border rounded-md"><option value="rigid-pavement">Rigid Pavement</option><option value="flexible-pavement">Flexible Pavement</option><option value="combination">Combination</option><option value="other">Other</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Road Hierarchy</label><select value={fd.roadHierarchy} onChange={(e) => setFd({...fd, roadHierarchy: e.target.value})} className="w-full px-3 py-2 border rounded-md"><option value="JAS">JAS</option><option value="JKS">JKS</option><option value="JLS">JLS</option><option value="Jling-S">Jling-S</option><option value="J-ling Kota">J-ling Kota</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Maintenance</label><select value={fd.maintenanceType} onChange={(e) => setFd({...fd, maintenanceType: e.target.value})} className="w-full px-3 py-2 border rounded-md"><option value="reconstruction">Reconstruction</option><option value="rehabilitation">Rehabilitation</option><option value="periodic-rehabilitation">Periodic Rehabilitation</option><option value="routine-maintenance">Routine Maintenance</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Start Date</label><input type="date" value={fd.startDate} onChange={(e) => setFd({...fd, startDate: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">End Date</label><input type="date" value={fd.endDate} onChange={(e) => setFd({...fd, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={submit} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"><Save size={18} />Save</button>
          <button onClick={onCancel} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md">Cancel</button>
        </div>
      </div>
    );
  };

  const Summary = () => {
    const total = projects.reduce((s, p) => s + Number(p.contractPrice || 0), 0);
    const avg = projects.length > 0 ? projects.reduce((s, p) => s + getProgress(p), 0) / projects.length : 0;
    const chartData = projects.map(p => ({name: p.name.substring(0, 15), progress: getProgress(p)}));

    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Total Projects</p><p className="text-3xl font-bold">{projects.length}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Total Value</p><p className="text-lg font-bold">{fmt(total)}</p></div>
          <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-600">Avg Progress</p><p className="text-3xl font-bold">{avg.toFixed(1)}%</p></div>
        </div>
        {projects.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Progress Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="progress" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b"><h2 className="text-xl font-bold">All Projects</h2></div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contractor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No projects</td></tr>
              ) : (
                projects.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-sm">{p.contractor}</td>
                    <td className="px-6 py-4 text-sm">{p.supervisor}</td>
                    <td className="px-6 py-4 text-sm">{fmt(p.contractPrice)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: getProgress(p) + '%'}}></div>
                        </div>
                        <span className="font-medium">{getProgress(p).toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => {setSelected(p); setView('detail');}} className="text-blue-600 hover:text-blue-800 font-medium">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const BoQ = ({ project, onUpdate }) => {
    const [items, setItems] = useState(project.boq || []);
    const [n, setN] = useState({description:'',quantity:'',unit:'',unitPrice:''});

    const add = () => {
      if (!n.description || !n.quantity || !n.unit || !n.unitPrice) {alert('Fill all'); return;}
      const item = {id: Date.now().toString(), ...n, quantity: Number(n.quantity), unitPrice: Number(n.unitPrice), total: Number(n.quantity) * Number(n.unitPrice), completed: 0};
      const u = [...items, item];
      setItems(u);
      setN({description:'',quantity:'',unit:'',unitPrice:''});
      save(u);
    };

    const del = (id) => {
      const u = items.filter(i => i.id !== id);
      setItems(u);
      save(u);
    };

    const save = async (b) => {
      await saveProject({...project, boq: b});
      onUpdate();
    };

    const t = items.reduce((s, i) => s + i.total, 0);

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">BoQ</h3>
        <div className="mb-4 grid grid-cols-5 gap-2">
          <input type="text" placeholder="Description" value={n.description} onChange={(e) => setN({...n, description: e.target.value})} className="px-3 py-2 border rounded-md text-sm" />
          <input type="number" placeholder="Qty" value={n.quantity} onChange={(e) => setN({...n, quantity: e.target.value})} className="px-3 py-2 border rounded-md text-sm" />
          <input type="text" placeholder="Unit" value={n.unit} onChange={(e) => setN({...n, unit: e.target.value})} className="px-3 py-2 border rounded-md text-sm" />
          <input type="number" placeholder="Price" value={n.unitPrice} onChange={(e) => setN({...n, unitPrice: e.target.value})} className="px-3 py-2 border rounded-md text-sm" />
          <button onClick={add} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">Add</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Qty</th>
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-left">Price</th>
                <th className="px-3 py-2 text-left">Total</th>
                <th className="px-3 py-2 text-left">Completed</th>
                <th className="px-3 py-2 text-left">%</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length === 0 ? (
                <tr><td colSpan="8" className="px-3 py-8 text-center text-gray-500">No items</td></tr>
              ) : (
                items.map(i => (
                  <tr key={i.id}>
                    <td className="px-3 py-2">{i.description}</td>
                    <td className="px-3 py-2">{i.quantity}</td>
                    <td className="px-3 py-2">{i.unit}</td>
                    <td className="px-3 py-2">{fmt(i.unitPrice)}</td>
                    <td className="px-3 py-2 font-medium">{fmt(i.total)}</td>
                    <td className="px-3 py-2">{i.completed || 0} {i.unit}</td>
                    <td className="px-3 py-2">{i.quantity > 0 ? ((i.completed || 0) / i.quantity * 100).toFixed(1) : 0}%</td>
                    <td className="px-3 py-2"><button onClick={() => del(i.id)} className="text-red-600"><Trash2 size={16} /></button></td>
                  </tr>
                ))
              )}
              {items.length > 0 && (
                <tr className="bg-gray-50 font-bold">
                  <td colSpan="4" className="px-3 py-2 text-right">TOTAL:</td>
                  <td className="px-3 py-2">{fmt(t)}</td>
                  <td colSpan="3"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const Weekly = ({ project, onUpdate }) => {
    const [reports, setReports] = useState(project.weeklyReports || []);
    const [showModal, setShowModal] = useState(false);
    const [n, setN] = useState({weekNumber:'',date:'',notes:'',workItems:[]});

    const openModal = () => {
      if (!project.boq || project.boq.length === 0) {
        alert('Please add BoQ items first!');
        return;
      }
      setN({weekNumber: reports.length + 1, date: '', notes: '', workItems: []});
      setShowModal(true);
    };

    const addWorkItem = () => {
      setN({...n, workItems: [...n.workItems, {boqItemId: '', qtyCompleted: ''}]});
    };

    const updateWorkItem = (idx, field, val) => {
      const updated = [...n.workItems];
      updated[idx][field] = val;
      setN({...n, workItems: updated});
    };

    const removeWorkItem = (idx) => {
      setN({...n, workItems: n.workItems.filter((_, i) => i !== idx)});
    };

    const calculateProgress = () => {
      const boq = project.boq || [];
      const totalValue = Number(project.contractPrice) || boq.reduce((s, i) => s + i.total, 0);
      
      if (totalValue === 0) return 0;

      let weekProgress = 0;
      n.workItems.forEach(wi => {
        const boqItem = boq.find(b => b.id === wi.boqItemId);
        if (boqItem && wi.qtyCompleted) {
          const itemValue = Number(wi.qtyCompleted) * boqItem.unitPrice;
          weekProgress += (itemValue / totalValue) * 100;
        }
      });

      return weekProgress;
    };

    const add = async () => {
      if (!n.weekNumber || !n.date || n.workItems.length === 0) {
        alert('Fill required fields and add at least one work item');
        return;
      }

      const weekProgress = calculateProgress();
      const prevCumulative = reports.length > 0 ? reports[reports.length - 1].cumulativeProgress : 0;
      const cumulativeProgress = prevCumulative + weekProgress;

      const boq = [...project.boq];
      n.workItems.forEach(wi => {
        const boqItem = boq.find(b => b.id === wi.boqItemId);
        if (boqItem) {
          boqItem.completed = (boqItem.completed || 0) + Number(wi.qtyCompleted);
        }
      });

      const r = {
        id: Date.now().toString(),
        weekNumber: Number(n.weekNumber),
        date: n.date,
        notes: n.notes,
        workItems: n.workItems,
        weekProgress: weekProgress,
        cumulativeProgress: cumulativeProgress
      };

      const u = [...reports, r].sort((a, b) => a.weekNumber - b.weekNumber);
      
      await saveProject({...project, weeklyReports: u, boq: boq});
      onUpdate();
      setReports(u);
      setShowModal(false);
    };

    const del = async (id) => {
      if (!window.confirm('Delete? Progress will be recalculated')) return;
      
      const u = reports.filter(r => r.id !== id);
      const boq = [...project.boq];
      boq.forEach(b => b.completed = 0);
      
      let cumulative = 0;
      u.forEach(r => {
        r.workItems.forEach(wi => {
          const boqItem = boq.find(b => b.id === wi.boqItemId);
          if (boqItem) {
            boqItem.completed = (boqItem.completed || 0) + Number(wi.qtyCompleted);
          }
        });
        cumulative += r.weekProgress;
        r.cumulativeProgress = cumulative;
      });

      await saveProject({...project, weeklyReports: u, boq: boq});
      onUpdate();
      setReports(u);
    };

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Weekly Reports (Weighted by BoQ)</h3>
          <button onClick={openModal} className="bg-green-600 text-white px-4 py-2 rounded-md text-sm">+ Add Week</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Week</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Items</th>
                <th className="px-3 py-2 text-left">Week %</th>
                <th className="px-3 py-2 text-left">Cumulative %</th>
                <th className="px-3 py-2 text-left">Notes</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.length === 0 ? (
                <tr><td colSpan="7" className="px-3 py-8 text-center text-gray-500">No reports</td></tr>
              ) : (
                reports.map(r => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 font-medium">{r.weekNumber}</td>
                    <td className="px-3 py-2">{r.date}</td>
                    <td className="px-3 py-2">{r.workItems.length}</td>
                    <td className="px-3 py-2 text-green-600 font-medium">+{r.weekProgress.toFixed(2)}%</td>
                    <td className="px-3 py-2 font-bold text-blue-600">{r.cumulativeProgress.toFixed(2)}%</td>
                    <td className="px-3 py-2">{r.notes || '-'}</td>
                    <td className="px-3 py-2"><button onClick={() => del(r.id)} className="text-red-600"><Trash2 size={16} /></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Add Weekly Report</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500"><X size={24} /></button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Week Number</label><input type="number" value={n.weekNumber} onChange={(e) => setN({...n, weekNumber: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
                <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" value={n.date} onChange={(e) => setN({...n, date: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Work Completed This Week</label>
                  <button onClick={addWorkItem} className="text-blue-600 text-sm">+ Add Item</button>
                </div>
                
                {n.workItems.map((wi, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                    <select value={wi.boqItemId} onChange={(e) => updateWorkItem(idx, 'boqItemId', e.target.value)} className="px-3 py-2 border rounded-md text-sm">
                      <option value="">Select BoQ Item</option>
                      {(project.boq || []).map(b => (
                        <option key={b.id} value={b.id}>{b.description} ({b.unit})</option>
                      ))}
                    </select>
                    <input type="number" step="0.01" placeholder="Qty Completed" value={wi.qtyCompleted} onChange={(e) => updateWorkItem(idx, 'qtyCompleted', e.target.value)} className="px-3 py-2 border rounded-md text-sm" />
                    <button onClick={() => removeWorkItem(idx)} className="text-red-600 text-sm">Remove</button>
                  </div>
                ))}

                {n.workItems.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No work items added yet</p>
                )}
              </div>

              {n.workItems.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-md mb-4">
                  <p className="text-sm font-medium">Calculated Progress: <span className="text-blue-600 text-lg">{calculateProgress().toFixed(2)}%</span></p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea value={n.notes} onChange={(e) => setN({...n, notes: e.target.value})} className="w-full px-3 py-2 border rounded-md" rows="3"></textarea>
              </div>

              <div className="flex gap-3">
                <button onClick={add} className="bg-green-600 text-white px-6 py-2 rounded-md">Save</button>
                <button onClick={() => setShowModal(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SCurve = ({ project }) => {
    const reports = project.weeklyReports || [];
    if (reports.length === 0) {
      return <div className="bg-white rounded-lg shadow p-6"><h3 className="text-xl font-bold mb-4">S-Curve</h3><div className="text-center py-12 text-gray-500">Add weekly reports to see S-curve</div></div>;
    }
    const data = reports.sort((a, b) => a.weekNumber - b.weekNumber).map(r => ({week: 'W' + r.weekNumber, Progress: r.cumulativeProgress}));
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">S-Curve (Weighted)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Progress" stroke="#82ca9d" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const Detail = ({ project }) => {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div><h2 className="text-2xl font-bold mb-2">{project.name}</h2><p className="text-gray-600">ID: {project.id}</p></div>
            <div className="flex gap-2">
              <button onClick={() => {setSelected(project); setView('edit');}} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md"><Edit2 size={18} />Edit</button>
              <button onClick={() => deleteProject(project.id)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md"><Trash2 size={18} />Delete</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-3">Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Contractor:</span><span className="font-medium">{project.contractor}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Supervisor:</span><span className="font-medium">{project.supervisor}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Price:</span><span className="font-medium">{fmt(project.contractPrice)}</span></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Technical</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Type:</span><span className="font-medium">{project.workType}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Hierarchy:</span><span className="font-medium">{project.roadHierarchy}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Maintenance:</span><span className="font-medium">{project.maintenanceType}</span></div>
              </div>
            </div>
          </div>
        </div>
        <BoQ project={project} onUpdate={loadProjects} />
        <Weekly project={project} onUpdate={loadProjects} />
        <SCurve project={project} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Nav />
      {view === 'summary' && <Summary />}
      {view === 'add' && <ProjectForm onSave={() => setView('summary')} onCancel={() => setView('summary')} />}
      {view === 'edit' && <ProjectForm existing={selected} onSave={() => setView('detail')} onCancel={() => setView('detail')} />}
      {view === 'detail' && selected && <Detail project={selected} />}
    </div>
  );
}