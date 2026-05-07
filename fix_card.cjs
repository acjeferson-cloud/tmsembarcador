const fs = require('fs');
let content = fs.readFileSync('src/components/ImplementationCenter/TaxationGroupsTab.tsx', 'utf8');

const createGroupOld = `      const group = await taxationService.createGroup({
        organization_id: user.organization_id,
        carrier_id: finalCarrierId,
        name: formData.name,
        type: formData.type
      });`;

const createGroupNew = `      const group = await taxationService.createGroup({
        organization_id: user.organization_id,
        carrier_id: finalCarrierId,
        name: formData.name,
        type: formData.type,
        created_by_user_name: user?.name || user?.email || 'Sistema'
      });`;

content = content.replace(createGroupOld, createGroupNew);

const cardOld = `              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-gray-900 dark:text-white">{group.memberCount}</span> CNPJs vinculados
                </div>
                <CheckCircle size={18} className="text-green-500" />
              </div>`;

const cardNew = `              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-gray-900 dark:text-white">{group.memberCount}</span> CNPJs vinculados
                  <div className="text-xs mt-1 opacity-70">
                    Importado por {group.created_by_user_name || 'Sistema'} em {new Date(group.created_at || new Date()).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'})}
                  </div>
                </div>
                <CheckCircle size={18} className="text-green-500" />
              </div>`;

content = content.replace(cardOld, cardNew);

fs.writeFileSync('src/components/ImplementationCenter/TaxationGroupsTab.tsx', content);
console.log('Fixed');
