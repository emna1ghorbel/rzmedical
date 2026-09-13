const fs = require('fs');
const path = 'E:\\rzmedical\\admin-panel\\src\\app\\(admin)\\orders\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace badge colors
content = content.replace(
  /const getStatusBadgeColor = \(statut: string\) => \{[\s\S]*?  \};/,
  `const getStatusBadgeColor = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE": return "warning";
      case "CONFIRMEE": return "info";
      case "LIVREE": return "success";
      case "ANNULEE": return "error";
      default: return "light";
    }
  };`
);

// Replace labels
content = content.replace(
  /const getStatusLabel = \(statut: string\) => \{[\s\S]*?  \};/,
  `const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE": return "En attente";
      case "CONFIRMEE": return "Confirmée";
      case "LIVREE": return "Livrée";
      case "ANNULEE": return "Annulée";
      default: return statut;
    }
  };`
);

// Replace select dropdown
content = content.replace(
  /<select[\s\S]*?<\/select>/,
  `<select
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            value={order.statut}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                          >
                            <option value="EN_ATTENTE">En attente</option>
                            <option value="CONFIRMEE">Confirmée</option>
                            <option value="LIVREE">Livrée</option>
                            <option value="ANNULEE">Annulée</option>
                          </select>`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced successfully');
