import { useQuery } from '@tanstack/react-query';
import { getVolumes, triggerOperation } from '../services/api';
import { useState, type ChangeEvent } from 'react';

export default function VolumeManager() {
  const [filter, setFilter] = useState<'eligible' | 'ineligible' | 'all'>('eligible');
  const { data, isLoading, refetch } = useQuery({ queryKey: ['volumes', filter], queryFn: () => getVolumes(filter) });

  const handleFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as 'eligible' | 'ineligible' | 'all';
    setFilter(value);
  };

  const handleExecute = async (volumeId: string) => {
    await triggerOperation(volumeId);
    refetch();
  };

  if (isLoading) return <div>Loading volumes...</div>;

  return (
    <div className="card">
      <div className="toolbar">
        <label>
          Filter:
          <select value={filter} onChange={handleFilterChange}>
            <option value="eligible">Eligible</option>
            <option value="ineligible">Ineligible</option>
            <option value="all">All</option>
          </select>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>Instance</th>
            <th>Volume</th>
            <th>Mount</th>
            <th>Provisioned</th>
            <th>Used</th>
            <th>Free%</th>
            <th>Recommended</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data?.items?.map((vol) => (
            <tr key={vol.volumeId}>
              <td>{vol.instanceId}</td>
              <td>{vol.volumeId}</td>
              <td>{vol.mountPoint}</td>
              <td>{vol.sizeGb} GB</td>
              <td>{vol.usedGb} GB</td>
              <td>{vol.freePercent}%</td>
              <td>{vol.targetSizeGb} GB</td>
              <td>{vol.status}</td>
              <td>
                {vol.eligible && (
                  <button onClick={() => handleExecute(vol.volumeId)} className="primary">
                    Execute now
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
