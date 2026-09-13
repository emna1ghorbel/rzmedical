const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, email: 'admin@rzmedical.tn', type: 'ADMIN' }, 'rzmedical_super_secret_jwt_key_2024_change_me', { expiresIn: '1h' });
console.log(token);
