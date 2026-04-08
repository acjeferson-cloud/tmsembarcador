import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { menuConfig } from '../../data/menuConfig';

interface MenuItem {
  id: string;
  label?: string; // Optional due to translation
  hasSubmenu?: boolean;
  submenu?: MenuItem[];
}

interface PermissionsTreeProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
}

export const PermissionsTree: React.FC<PermissionsTreeProps> = ({ selectedPermissions, onChange }) => {
  const { t } = useTranslation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [localPermissions, setLocalPermissions] = useState<string[]>(selectedPermissions);

  // Generate dynamic menu structure exactly mirroring the app navigation
  const menuItems: MenuItem[] = React.useMemo(() => {
    return menuConfig
      .filter(item => item.id !== 'saas-admin') // Ignore administrative console route
      .map(item => ({
        id: item.id,
        label: t(item.labelKey),
        hasSubmenu: item.hasSubmenu,
        submenu: item.submenu?.map(sub => ({
          id: sub.id,
          label: t(sub.labelKey)
        }))
      }));
  }, [t]);

  // Update local permissions when prop changes
  useEffect(() => {
    setLocalPermissions(selectedPermissions);
  }, [selectedPermissions]);

  // Toggle menu expansion
  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // Check if menu is expanded
  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  // Get all submenu IDs for a menu
  const getAllSubmenuIds = (menu: MenuItem): string[] => {
    if (!menu.hasSubmenu || !menu.submenu) return [];
    
    return menu.submenu.reduce((ids: string[], submenu) => {
      return [...ids, submenu.id, ...getAllSubmenuIds(submenu)];
    }, []);
  };

  // Check if a menu is selected
  const isMenuSelected = (menuId: string) => localPermissions.includes(menuId);

  // Check if all submenus of a menu are selected
  const areAllSubmenusSelected = (menu: MenuItem) => {
    if (!menu.hasSubmenu || !menu.submenu) return false;
    
    return menu.submenu.every(submenu => isMenuSelected(submenu.id));
  };

  // Check if some submenus of a menu are selected
  const areSomeSubmenusSelected = (menu: MenuItem) => {
    if (!menu.hasSubmenu || !menu.submenu) return false;
    
    return menu.submenu.some(submenu => isMenuSelected(submenu.id));
  };

  // Toggle menu selection
  const toggleMenuSelection = (menu: MenuItem) => {
    const menuId = menu.id;
    const isSelected = isMenuSelected(menuId);
    
    let newPermissions = [...localPermissions];
    
    if (isSelected) {
      // Remove this menu and all its submenus
      const submenuIds = menu.hasSubmenu ? getAllSubmenuIds(menu) : [];
      newPermissions = newPermissions.filter(id => id !== menuId && !submenuIds.includes(id));
    } else {
      // Add this menu and all its submenus
      newPermissions.push(menuId);
      
      if (menu.hasSubmenu && menu.submenu) {
        menu.submenu.forEach(submenu => {
          if (!newPermissions.includes(submenu.id)) {
            newPermissions.push(submenu.id);
          }
        });
      }
    }
    
    setLocalPermissions(newPermissions);
    onChange(newPermissions);
  };

  // Toggle submenu selection
  const toggleSubmenuSelection = (parentMenu: MenuItem, submenu: MenuItem) => {
    const submenuId = submenu.id;
    const isSelected = isMenuSelected(submenuId);
    
    let newPermissions = [...localPermissions];
    
    if (isSelected) {
      // Remove this submenu
      newPermissions = newPermissions.filter(id => id !== submenuId);
      
      // If parent was selected and now not all submenus are selected, remove parent too
      if (isMenuSelected(parentMenu.id)) {
        newPermissions = newPermissions.filter(id => id !== parentMenu.id);
      }
    } else {
      // Add this submenu
      newPermissions.push(submenuId);
      
      // If all submenus are now selected, add parent too
      const wouldAllSubmenusBeSelected = parentMenu.submenu?.every(
        sub => sub.id === submenuId || isMenuSelected(sub.id)
      );
      
      if (wouldAllSubmenusBeSelected && !newPermissions.includes(parentMenu.id)) {
        newPermissions.push(parentMenu.id);
      }
    }
    
    setLocalPermissions(newPermissions);
    onChange(newPermissions);
  };

  // Select all permissions
  const selectAll = () => {
    const allPermissions: string[] = [];
    
    // Add all menu and submenu IDs
    menuItems.forEach(menu => {
      allPermissions.push(menu.id);
      
      if (menu.hasSubmenu && menu.submenu) {
        menu.submenu.forEach(submenu => {
          allPermissions.push(submenu.id);
        });
      }
    });
    
    setLocalPermissions(allPermissions);
    onChange(allPermissions);
  };

  // Clear all permissions
  const clearAll = () => {
    setLocalPermissions([]);
    onChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-end space-x-4 mb-4">
        <button
          type="button"
          onClick={selectAll}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Selecionar Tudo
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors text-sm"
        >
          Limpar Tudo
        </button>
      </div>

      {/* Permissions Tree */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8 font-medium text-gray-700 dark:text-gray-300">Menu</div>
            <div className="col-span-4 font-medium text-gray-700 dark:text-gray-300">Permissão</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {menuItems.map((menu) => (
            <div key={menu.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900">
              {/* Parent Menu */}
              <div className="px-4 py-3">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-8">
                    <div className="flex items-center">
                      {menu.hasSubmenu ? (
                        <button
                          type="button"
                          onClick={() => toggleMenu(menu.id)}
                          className="mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
                        >
                          {isMenuExpanded(menu.id) ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                      ) : (
                        <div className="w-[18px] mr-2"></div>
                      )}
                      <span className="font-medium text-gray-800 dark:text-gray-200">{menu.label}</span>
                    </div>
                  </div>
                  <div className="col-span-4">
                    <button
                      type="button"
                      onClick={() => toggleMenuSelection(menu)}
                      className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white"
                    >
                      {isMenuSelected(menu.id) ? (
                        <CheckSquare size={20} className="text-blue-600" />
                      ) : areSomeSubmenusSelected(menu) ? (
                        <div className="w-5 h-5 border-2 border-blue-600 rounded-sm flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
                        </div>
                      ) : (
                        <Square size={20} className="text-gray-400" />
                      )}
                      <span className="ml-2">
                        {isMenuSelected(menu.id) ? 'Permitido' : areSomeSubmenusSelected(menu) ? 'Parcial' : 'Não permitido'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Submenus */}
              {menu.hasSubmenu && isMenuExpanded(menu.id) && menu.submenu && (
                <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                  {menu.submenu.map((submenu) => (
                    <div key={submenu.id} className="px-4 py-2 pl-10 hover:bg-gray-100 dark:bg-gray-700">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-8">
                          <span className="text-gray-700 dark:text-gray-300">{submenu.label}</span>
                        </div>
                        <div className="col-span-4">
                          <button
                            type="button"
                            onClick={() => toggleSubmenuSelection(menu, submenu)}
                            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white"
                          >
                            {isMenuSelected(submenu.id) ? (
                              <CheckSquare size={20} className="text-blue-600" />
                            ) : (
                              <Square size={20} className="text-gray-400" />
                            )}
                            <span className="ml-2">
                              {isMenuSelected(submenu.id) ? 'Permitido' : 'Não permitido'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
