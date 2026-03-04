import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const KEY = 'machinegrid';

// Seed data when KV is empty (your current machines + stickies)
const DEFAULT_SEED = {
  machines: [
    { id: 'mmbalmp0swy3zbkalmd', chipType: 'QS', motherboard: 'TS6', ip: '205', build: 'Build 2' },
    { id: 'mmbamf9juf3r6s5i03j', chipType: 'QS', motherboard: 'TS5', ip: '213', build: 'Lakshme - 2' },
    { id: 'mmbamok8ljnu3xjwrcn', chipType: 'QS', motherboard: 'TS4', ip: '32', build: 'Venu' },
    { id: 'mmbamzcwkzj08zi2mlb', chipType: 'QS', motherboard: 'TS5', ip: '212', build: 'Build 2' },
    { id: 'mmban61lshjv419vz6h', chipType: 'PS', motherboard: 'TS7', ip: '184', build: 'Build 1' },
    { id: 'mmbanadd9da5dq121wq', chipType: 'V0', motherboard: 'TS4', ip: '127', build: 'Venu' },
    { id: 'mmbanijk3a9gqqp99g', chipType: 'PS', motherboard: 'TS6', ip: '149', build: '' },
    { id: 'mmbanpwval6n9q0sfw4', chipType: 'QS', motherboard: 'TS4', ip: '142', build: 'Lakshme - 1' },
    { id: 'mmbanxohuhwwbuo2goo', chipType: 'PS', motherboard: 'TS6', ip: '163', build: 'Build 2' },
  ],
  stickies: [
    { id: 'mmbaptx9n8ix98wa5q', machineId: 'mmbanijk3a9gqqp99g', running: '100x Shutdown', who: 'Peter', createdAt: 0, removedAt: 1772589393886 },
    { id: 'mmbaq5jz2jvkg93pwft', machineId: 'mmbanxohuhwwbuo2goo', running: 'IDK', who: 'IDK', createdAt: 0, removedAt: 1772589398327 },
    { id: 'mmbg873e8oghc4zxcjp', machineId: 'mmbalmp0swy3zbkalmd', running: 'MS 250X', who: 'Wataru', createdAt: 1772593205738, removedAt: 1772644697921 },
    { id: 'mmcg99s6osb4pxnu8y', machineId: 'mmbalmp0swy3zbkalmd', running: 'MS 10X', who: 'Wataru/Peter', createdAt: 1772653722054 },
    { id: 'mmcgfctci83p2dxx88', machineId: 'mmbamzcwkzj08zi2mlb', running: 'Peter might be using IDK', who: 'Peter', createdAt: 1772654005920 },
    { id: 'mmcgfyhairh23c5fd9n', machineId: 'mmbamok8ljnu3xjwrcn', running: 'MS', who: 'Wataru', createdAt: 1772654033998, removedAt: 1772654105104 },
    { id: 'mmcghvtw2lw7u46to5e', machineId: 'mmbamok8ljnu3xjwrcn', running: 'Debugging PICE Thing', who: 'Peter', createdAt: 1772654123876, removedAt: 1772654523445 },
    { id: 'mmcgqluieysdzgm2bv4', machineId: 'mmbamok8ljnu3xjwrcn', running: '2x MS', who: 'Wataru/Peter', createdAt: 1772654530842 },
    { id: 'mmcipzz60hwtwrq47bfa', machineId: 'mmban61lshjv419vz6h', running: 'Corebooting', who: 'Wataru', createdAt: 1772657861730 },
    { id: 'mmciq5k0frt90nj7apj', machineId: 'mmbanxohuhwwbuo2goo', running: 'Corebooting', who: 'Wataru', createdAt: 1772657868960 },
  ],
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      let data = await redis.get(KEY);
      if (data == null) {
        data = DEFAULT_SEED;
        await redis.set(KEY, JSON.stringify(data));
      } else if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      res.status(200).json(data);
      return;
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !Array.isArray(body.machines) || !Array.isArray(body.stickies)) {
        res.status(400).json({ error: 'Need machines and stickies' });
        return;
      }
      const data = { machines: body.machines, stickies: body.stickies };
      await redis.set(KEY, JSON.stringify(data));
      res.status(200).json(data);
      return;
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message) });
  }
}
