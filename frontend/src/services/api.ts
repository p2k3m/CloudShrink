import axios from 'axios';
import { getIdToken } from './auth';

const apiBase = import.meta.env.VITE_API_BASE ?? 'https://example.execute-api.local';

async function client() {
  const token = await getIdToken();
  return axios.create({
    baseURL: apiBase,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getDashboard() {
  const c = await client();
  const { data } = await c.get('/dashboard');
  return data;
}

export async function getVolumes(filter: string) {
  const c = await client();
  const { data } = await c.get('/volumes', { params: { filter } });
  return data;
}

export async function triggerOperation(volumeId: string) {
  const c = await client();
  await c.post('/operations', { volumeId, action: 'shrink' });
}

export async function getPolicies() {
  const c = await client();
  const { data } = await c.get('/policies');
  return data;
}

export async function savePolicy(policy: unknown) {
  const c = await client();
  await c.post('/policies', policy);
}
