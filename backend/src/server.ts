import app from './app';
import os from 'os';

const PORT = process.env.PORT || 4000;

// Écoute sur 0.0.0.0 pour être accessible depuis tout le réseau local
app.listen(Number(PORT), '0.0.0.0', () => {
  // Afficher toutes les IPs disponibles
  const nets = os.networkInterfaces();
  const ips: string[] = [];
  for (const ifaces of Object.values(nets)) {
    for (const iface of (ifaces || [])) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  console.log(`✅ Serveur MediSupply démarré !`);
  console.log(`   Local:    http://localhost:${PORT}`);
  ips.forEach(ip => console.log(`   Réseau:   http://${ip}:${PORT}`));
});
