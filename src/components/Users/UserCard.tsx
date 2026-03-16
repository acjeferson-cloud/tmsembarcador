import React from 'react';
import { Edit, Trash2, Eye, User, Mail, Phone, Building, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { User as UserType } from '../../services/usersService';
import { useTranslation } from 'react-i18next';

interface UserCardProps {
  user: UserType;
  onView: (user: UserType) => void;
  onEdit: (user: UserType) => void;
  onDelete: (userId: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onView, 
  onEdit, 
  onDelete 
}) => {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      case 'bloqueado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerfilColor = (perfil: string) => {
    switch (perfil) {
      case 'administrador': return 'bg-purple-100 text-purple-800';
      case 'gerente': return 'bg-blue-100 text-blue-800';
      case 'operador': return 'bg-green-100 text-green-800';
      case 'visualizador': return 'bg-yellow-100 text-yellow-800';
      case 'personalizado': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo': return <CheckCircle size={14} />;
      case 'inativo': return <Clock size={14} />;
      case 'bloqueado': return <AlertTriangle size={14} />;
      default: return <User size={14} />;
    }
  };

  const getPerfilIcon = (perfil: string) => {
    switch (perfil) {
      case 'administrador': return <Shield size={14} />;
      case 'gerente': return <Building size={14} />;
      case 'operador': return <User size={14} />;
      case 'visualizador': return <Eye size={14} />;
      case 'personalizado': return <Shield size={14} />;
      default: return <User size={14} />;
    }
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return t('users.view.never');
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t('users.view.now');
    if (diffInHours < 24) return `${diffInHours} ${t('users.view.hoursAgo')}`;
    if (diffInHours < 48) return t('users.view.yesterday');
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case 'ativo': return t('users.filters.active');
      case 'inativo': return t('users.filters.inactive');
      case 'bloqueado': return t('users.filters.blocked');
      default: return status;
    }
  };

  const getRoleTranslation = (perfil: string) => {
    switch (perfil) {
      case 'administrador': return t('users.form.roles.admin');
      case 'gerente': return t('users.form.roles.manager');
      case 'operador': return t('users.form.roles.operator');
      case 'visualizador': return t('users.form.roles.viewer');
      case 'personalizado': return t('users.form.roles.custom');
      default: return perfil;
    }
  };

  const isProtectedUser = user.id === '1';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600">{user.codigo}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{user.nome}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{user.cargo}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => onView(user)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            title={t('users.buttons.view')}
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => onEdit(user)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            title={t('users.buttons.edit')}
          >
            <Edit size={16} />
          </button>
          {!isProtectedUser && (
            <button 
              onClick={() => onDelete(user.id)}
              className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
              title={t('users.buttons.delete')}
            >
              <Trash2 size={16} />
            </button>
          )}
          {isProtectedUser && (
            <div className="p-1 text-yellow-500" title={t('users.stats.adminProtectUser')}>
              <Shield size={16} />
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Mail size={14} />
          <span className="truncate">{user.email}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Phone size={14} />
          <span>{user.celular || user.telefone || t('users.view.emptyPhone')}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Building size={14} />
          <span className="truncate">{user.departamento || t('users.view.emptyDept')}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <User size={14} />
          <span className="truncate">{user.estabelecimento_nome || t('establishments.view.notConfigured')}</span>
        </div>

        {/* Login attempts warning */}
        {(user.tentativas_login || 0) > 0 && (
          <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-2 py-1 rounded">
            <AlertTriangle size={14} />
            <span className="text-xs font-medium">
              {user.tentativas_login} {t('users.view.loginAttempts', { count: user.tentativas_login })}
            </span>
          </div>
        )}

        {/* Permissions info for personalized profile */}
        {user.perfil === 'personalizado' && (
          <div className="flex items-center space-x-2 text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
            <Shield size={14} />
            <span className="text-xs font-medium">
              {user.permissoes?.length || 0} {t('users.view.permissionsConfigured', { count: user.permissoes?.length || 0 })}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Status and Profile */}
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status || '')}`}>
            {getStatusIcon(user.status || '')}
            <span className="ml-1 capitalize">{getStatusTranslation(user.status || '')}</span>
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerfilColor(user.perfil || '')}`}>
            {getPerfilIcon(user.perfil || '')}
            <span className="ml-1 capitalize">{getRoleTranslation(user.perfil || '')}</span>
          </div>
        </div>

        {/* Last Login */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {t('users.view.lastLogin')}: {formatLastLogin(user.ultimo_login)}
        </div>
      </div>
    </div>
  );
};