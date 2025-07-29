import express from 'express';
import cors from 'cors';
import { loadApplications, fetchNewApplications } from './gmail';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/applications', (req, res) => {
  const apps = loadApplications();
  res.json(apps);
});

app.get('/update', async (req, res) => {
  try {
    const newApps = await fetchNewApplications();
    res.json({ added: newApps.length });
  } catch (err: any) {
    console.error('Update failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
