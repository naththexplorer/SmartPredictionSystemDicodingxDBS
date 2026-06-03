import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');

const readData = (filename) => {
  const filePath = join(DATA_DIR, filename);
  if (!existsSync(filePath)) return [];
  return JSON.parse(readFileSync(filePath, 'utf-8'));
};

const writeData = (filename, data) => {
  const filePath = join(DATA_DIR, filename);
  writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export const db = {
  users: {
    getAll: () => readData('users.json'),
    save: (data) => writeData('users.json', data),
    findByEmail: (email) => readData('users.json').find(u => u.email === email),
    findById: (id) => readData('users.json').find(u => u.id === id),
  },
  reports: {
    getAll: () => readData('reports.json'),
    save: (data) => writeData('reports.json', data),
    findById: (id) => readData('reports.json').find(r => r.id === id),
  },
  predictions: {
    getAll: () => readData('predictions.json'),
    save: (data) => writeData('predictions.json', data),
  },
  disasters: {
    getAll: () => readData('disasters.json'),
    save: (data) => writeData('disasters.json', data),
    findById: (id) => readData('disasters.json').find(d => d.id === id),
  },
};