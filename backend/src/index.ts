import dotenv from 'dotenv';
import { createApiApp } from './app';

dotenv.config();

const app = createApiApp();
const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
