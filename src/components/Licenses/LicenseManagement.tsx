import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import {
  Key,
  UserCheck,
  UserX,
  ArrowRightLeft,
  ShoppingCart,
  Search,
  History,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Edit
} from 'lucide-react';
import { licensesService, License, UserWithLicense, LicenseLog } from '../../services/licensesService';
import { useAuth } from '../../hooks/useAuth';
import { UserForm } from '../Users/UserForm';
import { usersService, User } from '../../services/usersService';
import { useTranslation } from 'react-i18next';

type ToastType = 'success' | 'error' | 'info';

const Toast: React.FC<{ message: string; type: ToastType; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-4 py-3 rounded-lg border ${colors[type]} shadow-lg animate-slide-in`}>
      {icons[type]}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
};

const PurchaseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (quantity: number) => Promise<void>;
}> = ({ isOpen, onClose, onPurchase }) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setIsLoading(true);
    await onPurchase(quantity);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('licenses.purchaseModal.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                {t('licenses.purchaseModal.warning')}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('licenses.purchaseModal.quantityMsg')}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('licenses.purchaseModal.estimatedValue')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">R$ 49,90/mês</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-600 dark:text-gray-400">{t('licenses.purchaseModal.totalMonthly')}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                R$ {(quantity * 49.9).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {t('licenses.purchaseModal.cancel')}
          </button>
          <button
            onClick={handlePurchase}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isLoading ? t('licenses.purchaseModal.processing') : t('licenses.purchaseModal.request')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const TransferModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  fromUser: UserWithLicense | null;
  users: UserWithLicense[];
  onTransfer: (toUserId: string) => Promise<void>;
}> = ({ isOpen, onClose, fromUser, users, onTransfer }) => {
  const { t } = useTranslation();
  const [selectedUser, setSelectedUser] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !fromUser) return null;

  const availableUsers = users.filter(u => u.codigo !== fromUser.codigo && !u.has_license);

  const handleTransfer = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    await onTransfer(selectedUser);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('licenses.transferModal.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>{t('licenses.transferModal.from')}</strong> {fromUser.nome} ({fromUser.codigo})
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('licenses.transferModal.to')}
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">{t('licenses.transferModal.selectUser')}</option>
              {availableUsers.map(user => (
                <option key={user.codigo} value={user.codigo}>
                  {user.nome} ({user.codigo})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('licenses.transferModal.cancel')}
          </button>
          <button
            onClick={handleTransfer}
            disabled={isLoading || !selectedUser}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{isLoading ? t('licenses.transferModal.transferring') : t('licenses.transferModal.transfer')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const LicenseManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [licenseConfig, setLicenseConfig] = useState<License | null>(null);
  const [users, setUsers] = useState<UserWithLicense[]>([]);
  const [logs, setLogs] = useState<LicenseLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<UserWithLicense | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const [currentPageLogs, setCurrentPageLogs] = useState(1);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const [config, usersData, logsData] = await Promise.all([
        licensesService.getLicenseConfig(),
        licensesService.getUsersWithLicenseStatus(),
        licensesService.getLicenseLogs(100)
      ]);

      setLicenseConfig(config);
      setLogs(logsData);

      if (usersData && usersData.length > 0) {
        const usersWithoutLicense = usersData.filter(u => !u.has_license);

        if (usersWithoutLicense.length > 0 && user?.id) {
          const result = await licensesService.assignAllUsersLicenses(user.id.toString());
          if (result.success) {
            const updatedUsers = await licensesService.getUsersWithLicenseStatus();
            setUsers(updatedUsers);
          } else {
            setUsers(usersData);
          }
        } else {
          setUsers(usersData);
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      setUsers([]);
    }

    setIsLoading(false);
  };

  const handleAssignLicense = async (userId: string) => {
    if (!user?.id) return;

    const success = await licensesService.assignLicense(userId, user.id.toString());
    if (success) {
      setToast({ message: t('licenses.messages.assignSuccess'), type: 'success' });
      loadData();
    } else {
      setToast({ message: t('licenses.messages.assignError'), type: 'error' });
    }
  };

  const handleRevokeLicense = async (userId: string) => {
    if (!user?.id) return;

    const success = await licensesService.revokeLicense(userId, user.id.toString());
    if (success) {
      setToast({ message: t('licenses.messages.revokeSuccess'), type: 'success' });
      loadData();
    } else {
      setToast({ message: t('licenses.messages.revokeError'), type: 'error' });
    }
  };

  const handleTransferLicense = async (toUserId: string) => {
    if (!user?.id || !selectedUserForTransfer) return;

    const success = await licensesService.transferLicense(
      selectedUserForTransfer.codigo,
      toUserId,
      user.id.toString()
    );

    if (success) {
      setToast({ message: t('licenses.messages.transferSuccess'), type: 'success' });
      loadData();
    } else {
      setToast({ message: t('licenses.messages.transferError'), type: 'error' });
    }
  };

  const handlePurchase = async (quantity: number) => {
    if (!user?.id) return;

    const success = await licensesService.purchaseNewLicenses(quantity, user.id.toString());
    if (success) {
      setToast({ message: t('licenses.messages.purchaseSuccess', { count: quantity }), type: 'success' });
      loadData();
    } else {
      setToast({ message: t('licenses.messages.purchaseError'), type: 'error' });
    }
  };

  const handleNewUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = async (userId: string) => {
    const userToEdit = await usersService.getById(userId);
    if (userToEdit) {
      setEditingUser(userToEdit);
      setShowUserForm(true);
    }
  };

  const handleSaveUser = async (userData: any) => {
    try {
      if (editingUser) {
        const updated = await usersService.update(editingUser.id, userData);
        if (updated) {
          setToast({ message: t('licenses.messages.saveUserSuccess'), type: 'success' });
        }
      } else {
        await usersService.create(userData);
        setToast({ message: t('licenses.messages.createUserSuccess'), type: 'success' });
      }
      setShowUserForm(false);
      setEditingUser(null);
      loadData();
    } catch (error) {
      setToast({ message: t('licenses.messages.saveUserError'), type: 'error' });
    }
  };

  const filteredUsers = users.filter(u =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const licensedCount = users.filter(u => u.has_license).length;

  const totalPagesUsers = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndexUsers = (currentPageUsers - 1) * itemsPerPage;
  const endIndexUsers = startIndexUsers + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndexUsers, endIndexUsers);

  const totalPagesLogs = Math.ceil(logs.length / itemsPerPage);
  const startIndexLogs = (currentPageLogs - 1) * itemsPerPage;
  const endIndexLogs = startIndexLogs + itemsPerPage;
  const paginatedLogs = logs.slice(startIndexLogs, endIndexLogs);

  const getActionText = (log: LicenseLog) => {
    switch (log.action) {
      case 'assigned':
        return t('licenses.historyMessages.assigned');
      case 'revoked':
        return t('licenses.historyMessages.revoked');
      case 'transferred':
        return t('licenses.historyMessages.transferred');
      case 'purchased':
        return t('licenses.historyMessages.purchased');
      default:
        return log.action;
    }
  };

  const breadcrumbItems = [
    { label: t('common.settings', { defaultValue: 'Configurações' }) },
    { label: t('licenses.title'), current: true }
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t('licenses.messages.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (showUserForm) {
    return (
      <UserForm
        onBack={() => {
          setShowUserForm(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        user={editingUser || undefined}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('licenses.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('licenses.subtitle')}
          </p>
        </div>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('licenses.counters.total')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {licenseConfig?.total_licenses || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('licenses.counters.inUse')}</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {licensedCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('licenses.counters.available')}</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                {licenseConfig?.available_licenses || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('licenses.searchUser')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleNewUser}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('licenses.actions.newUser')}</span>
            </button>

            <button
              onClick={() => setShowLogs(!showLogs)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <History className="w-4 h-4" />
              <span>{t('licenses.actions.history')}</span>
            </button>

            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t('licenses.actions.purchase')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {!showLogs ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('licenses.table.code')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('licenses.table.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('licenses.table.profile')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('licenses.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('licenses.table.license')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('licenses.table.licenseCode')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('licenses.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.map((userItem, index) => (
                  <tr key={userItem.id || `${userItem.codigo}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {userItem.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {userItem.nome}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {userItem.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {userItem.perfil}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        userItem.status === 'ativo'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}>
                        {userItem.status === 'ativo' ? t('licenses.status.active') : t('licenses.status.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {userItem.has_license ? (
                        <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                          <UserCheck className="w-4 h-4" />
                          <span className="text-sm font-medium">{t('licenses.status.licensed')}</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-gray-400 dark:text-gray-500 dark:text-gray-400">
                          <UserX className="w-4 h-4" />
                          <span className="text-sm font-medium">{t('licenses.status.unlicensed')}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {userItem.license_id ? (
                        <div className="text-sm">
                          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-900 dark:text-gray-100">
                            {userItem.license_id}
                          </code>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => userItem.id && handleEditUser(userItem.id)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          title={t('licenses.actions.editUser')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {userItem.has_license ? (
                          <>
                            <button
                              onClick={() => handleRevokeLicense(userItem.codigo)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              title={t('licenses.actions.revokeLicense')}
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUserForTransfer(userItem);
                                setShowTransferModal(true);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                              title={t('licenses.actions.transferLicense')}
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleAssignLicense(userItem.codigo)}
                            disabled={!licenseConfig || licenseConfig.available_licenses <= 0}
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('licenses.actions.assignLicense')}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPagesUsers > 1 && (
            <div className="mt-4 flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                {t('common.showingOutTo', { start: startIndexUsers + 1, end: Math.min(endIndexUsers, filteredUsers.length), total: filteredUsers.length, defaultValue: `Mostrando ${startIndexUsers + 1} a ${Math.min(endIndexUsers, filteredUsers.length)} de ${filteredUsers.length} registros` })}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPageUsers(prev => Math.max(1, prev - 1))}
                  disabled={currentPageUsers === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {t('common.previous', { defaultValue: 'Anterior' })}
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('common.pageOf', { current: currentPageUsers, total: totalPagesUsers, defaultValue: `Página ${currentPageUsers} de ${totalPagesUsers}` })}
                </span>
                <button
                  onClick={() => setCurrentPageUsers(prev => Math.min(totalPagesUsers, prev + 1))}
                  disabled={currentPageUsers === totalPagesUsers}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {t('common.next', { defaultValue: 'Próxima' })}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('licenses.historyTitle')}
          </h2>
          <div className="space-y-3">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getActionText(log)} - {log.notes}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('licenses.historyMessages.by')}: {log.performed_by} • {new Date(log.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {totalPagesLogs > 1 && (
            <div className="mt-4 flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                {t('common.showingOutTo', { start: startIndexLogs + 1, end: Math.min(endIndexLogs, logs.length), total: logs.length, defaultValue: `Mostrando ${startIndexLogs + 1} a ${Math.min(endIndexLogs, logs.length)} de ${logs.length} registros` })}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPageLogs(prev => Math.max(1, prev - 1))}
                  disabled={currentPageLogs === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {t('common.previous', { defaultValue: 'Anterior' })}
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('common.pageOf', { current: currentPageLogs, total: totalPagesLogs, defaultValue: `Página ${currentPageLogs} de ${totalPagesLogs}` })}
                </span>
                <button
                  onClick={() => setCurrentPageLogs(prev => Math.min(totalPagesLogs, prev + 1))}
                  disabled={currentPageLogs === totalPagesLogs}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {t('common.next', { defaultValue: 'Próxima' })}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchase}
      />

      <TransferModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setSelectedUserForTransfer(null);
        }}
        fromUser={selectedUserForTransfer}
        users={users}
        onTransfer={handleTransferLicense}
      />
    </div>
  );
};
