import 'dotenv/config';
import jwt from 'jsonwebtoken';
const token = jwt.sign({ id: 1, email: 'admin@admin.com', type: 'ADMIN' }, process.env.JWT_SECRET || 'medisupply_secret_2026', { expiresIn: '1d' });
fetch('http://localhost:4000/api/invoices/admin/generate-number', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(async res => {
  console.log(res.status);
  console.log(res.headers.get('content-type'));
  console.log(await res.text());
})
.catch(console.error);
