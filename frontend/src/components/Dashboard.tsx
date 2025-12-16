import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../services/api';

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });

  if (isLoading) return <div>Loading dashboard...</div>;

  return (
    <div className="card-grid">
      <div className="card">
        <h3>Total savings estimate</h3>
        <p>{data?.savingsEstimate ?? 0} GB-month</p>
      </div>
      <div className="card">
        <h3>Protected volumes</h3>
        <p>{data?.protectedVolumes ?? 0}</p>
      </div>
      <div className="card">
        <h3>Onboarded accounts</h3>
        <p>{data?.accounts?.length ?? 0}</p>
      </div>
      <div className="card">
        <h3>Last scan</h3>
        <p>{data?.lastScan ?? 'n/a'}</p>
      </div>
      <div className="card full">
        <h3>Accounts</h3>
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Status</th>
              <th>Last scan</th>
            </tr>
          </thead>
          <tbody>
            {data?.accounts?.map((acct) => (
              <tr key={acct.accountId}>
                <td>{acct.accountId}</td>
                <td>{acct.status}</td>
                <td>{acct.lastScan ?? 'n/a'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
