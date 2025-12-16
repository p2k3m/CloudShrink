import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPolicies, savePolicy } from '../services/api';
import { useState } from 'react';

export default function PolicyPage() {
  const { data, isLoading } = useQuery({ queryKey: ['policies'], queryFn: getPolicies });
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: savePolicy,
    onSuccess: () => client.invalidateQueries({ queryKey: ['policies'] }),
  });
  const [form, setForm] = useState({
    tagKey: 'cloudshrink_enable',
    tagValue: 'true',
    bufferPercent: 20,
    minSizeGb: 50,
    maxSizeGb: 2048,
    cooldownHours: 24,
    snapshotRetentionDays: 7,
    approvalMode: 'manual',
  });

  if (isLoading) return <div>Loading policies...</div>;

  return (
    <div className="card-grid">
      <div className="card">
        <h3>Current policy</h3>
        <pre>{JSON.stringify(data?.items ?? [], null, 2)}</pre>
      </div>
      <div className="card">
        <h3>Update policy</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
        >
          <label>
            Tag key
            <input value={form.tagKey} onChange={(e) => setForm({ ...form, tagKey: e.target.value })} />
          </label>
          <label>
            Tag value
            <input value={form.tagValue} onChange={(e) => setForm({ ...form, tagValue: e.target.value })} />
          </label>
          <label>
            Buffer %
            <input
              type="number"
              value={form.bufferPercent}
              onChange={(e) => setForm({ ...form, bufferPercent: Number(e.target.value) })}
            />
          </label>
          <label>
            Min size GB
            <input
              type="number"
              value={form.minSizeGb}
              onChange={(e) => setForm({ ...form, minSizeGb: Number(e.target.value) })}
            />
          </label>
          <label>
            Max size GB
            <input
              type="number"
              value={form.maxSizeGb}
              onChange={(e) => setForm({ ...form, maxSizeGb: Number(e.target.value) })}
            />
          </label>
          <label>
            Cooldown hours
            <input
              type="number"
              value={form.cooldownHours}
              onChange={(e) => setForm({ ...form, cooldownHours: Number(e.target.value) })}
            />
          </label>
          <label>
            Snapshot retention days
            <input
              type="number"
              value={form.snapshotRetentionDays}
              onChange={(e) => setForm({ ...form, snapshotRetentionDays: Number(e.target.value) })}
            />
          </label>
          <label>
            Approval mode
            <select
              value={form.approvalMode}
              onChange={(e) => setForm({ ...form, approvalMode: e.target.value })}
            >
              <option value="manual">Manual</option>
              <option value="auto">Auto</option>
            </select>
          </label>
          <button className="primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save policy'}
          </button>
        </form>
      </div>
    </div>
  );
}
