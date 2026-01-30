'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import { useForm } from 'react-hook-form'
import { useToast } from '@/lib/toast-context'
import { Search, Bell, HelpCircle, Settings, User, ChevronDown, UserCircle, Users, FileText, ArrowLeft, Edit, Trash2, Eye, EyeOff, Calendar, Download, Filter, Shield, Check, Lightbulb, Lock, Clock, ChevronRight, X, Fingerprint, Key, Pencil, Power, Globe, Building2 } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import Link from 'next/link'
import { 
  fetchBrandMarketMappings, 
  createBrandMarketMapping, 
  updateBrandMarketMapping, 
  deleteBrandMarketMapping,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchActivityLogs
} from '@/lib/utils/supabase-helpers'
import { formatDistanceToNow } from 'date-fns'

export default function SettingsPage() {
  const { user: session, loading } = useAuth()
  const { showToast } = useToast()
  const [activeMenu, setActiveMenu] = useState('General')
  
  // Redirect User role to dashboard (User can only access dashboard)
  useEffect(() => {
    if (!loading && session?.role === 'User') {
      window.location.href = '/dashboard'
    }
  }, [session, loading])
  
  // Don't render anything if User role
  if (!loading && session?.role === 'User') {
    return null
  }
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [activitySearch, setActivitySearch] = useState('')
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [is2FACodeModalOpen, setIs2FACodeModalOpen] = useState(false)
  const [is2FAEnabled, setIs2FAEnabled] = useState(true)
  const [securityCode, setSecurityCode] = useState('123456')
  const [tempSecurityCode, setTempSecurityCode] = useState('')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    username: '',
    bio: ''
  })
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [showAddUserPassword, setShowAddUserPassword] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)
  // User Management - Now using Supabase
  const [usersList, setUsersList] = useState([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  
  // Activity Log - Now using Supabase
  const [activities, setActivities] = useState([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)

  // Initialize profile data from session
  useEffect(() => {
    if (session) {
      setProfileData({
        fullName: session.name || '',
        email: session.email || '',
        username: session.username || '',
        bio: ''
      })
    }
  }, [session])

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false)
      }
    }
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  // Filter menu items based on user role
  const allMenuItems = [
    { id: 'General', label: 'General', icon: Globe, roles: ['Admin'] },
    { id: 'Profile Setting', label: 'Profile Setting', icon: UserCircle, roles: ['Admin', 'Manager'] },
    { id: 'User Management', label: 'User Management', icon: Users, roles: ['Admin'] },
    { id: 'Activity Log', label: 'Activity Log', icon: FileText, roles: ['Admin'] },
  ]
  
  const menuItems = allMenuItems.filter(item => {
    if (!session || !session.role) return false
    return item.roles?.includes(session.role) || false
  })
  
  // Set default active menu to first available menu for Manager
  useEffect(() => {
    if (session?.role === 'Manager' && menuItems.length > 0 && !menuItems.find(item => item.id === activeMenu)) {
      setActiveMenu(menuItems[0].id)
    }
  }, [session?.role, menuItems.length])

  // Brand & Market mapping data - Now using Supabase
  const [brandMarketMapping, setBrandMarketMapping] = useState([])
  const [isEditMappingModalOpen, setIsEditMappingModalOpen] = useState(false)
  const [isAddMappingModalOpen, setIsAddMappingModalOpen] = useState(false)
  const [isDeleteMappingModalOpen, setIsDeleteMappingModalOpen] = useState(false)
  const [selectedMapping, setSelectedMapping] = useState(null)
  const [mappingSearch, setMappingSearch] = useState('')
  const [isLoadingMappings, setIsLoadingMappings] = useState(false)

  // Fetch brand market mappings from Supabase
  useEffect(() => {
    const loadMappings = async () => {
      setIsLoadingMappings(true)
      try {
        const data = await fetchBrandMarketMappings()
        setBrandMarketMapping(data)
      } catch (error) {
        console.error('Error loading brand market mappings:', error)
        showToast('Failed to load brand market mappings', 'error')
      } finally {
        setIsLoadingMappings(false)
      }
    }

    if (activeMenu === 'General') {
      loadMappings()
    }
  }, [activeMenu, showToast])

  // Fetch users from Supabase
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const data = await fetchUsers()
        setUsersList(data)
      } catch (error) {
        console.error('Error loading users:', error)
        showToast('Failed to load users', 'error')
      } finally {
        setIsLoadingUsers(false)
      }
    }

    if (activeMenu === 'User Management') {
      loadUsers()
    }
  }, [activeMenu, showToast])

  // Fetch activity logs from Supabase
  useEffect(() => {
    const loadActivities = async () => {
      setIsLoadingActivities(true)
      try {
        const data = await fetchActivityLogs(200, 0)
        // Format activities for display
        const formattedActivities = data.map(activity => ({
          id: activity.id,
          user: activity.user_name,
          action: activity.action,
          target: activity.target || 'System',
          timestamp: activity.created_at 
            ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
            : 'Unknown',
          ip: activity.ip_address || 'N/A'
        }))
        setActivities(formattedActivities)
      } catch (error) {
        console.error('Error loading activity logs:', error)
        showToast('Failed to load activity logs', 'error')
        setActivities([])
      } finally {
        setIsLoadingActivities(false)
      }
    }

    if (activeMenu === 'Activity Log') {
      loadActivities()
    }
  }, [activeMenu, showToast])

  // Use state for users list
  const users = usersList

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.role.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredActivities = activities.filter(activity =>
    activity.user.toLowerCase().includes(activitySearch.toLowerCase()) ||
    activity.action.toLowerCase().includes(activitySearch.toLowerCase()) ||
    activity.target.toLowerCase().includes(activitySearch.toLowerCase())
  )

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="flex items-center justify-center pt-6 mb-6">
        <nav className="inline-flex bg-white dark:bg-dark-card p-1 rounded-full" aria-label="Tabs">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                activeMenu === item.id
                  ? 'bg-gold-500 text-gray-900 dark:text-gray-900 shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div>
            {activeMenu === 'General' && (
              <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Brand & Market Mapping</h2>
                  <button
                    onClick={() => setIsAddMappingModalOpen(true)}
                    className="px-4 py-2 bg-gold-500 text-gray-900 rounded-lg font-medium hover:bg-gold-600 transition-colors flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    Add Mapping
                  </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search brand or market..."
                      value={mappingSearch}
                      onChange={(e) => setMappingSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>

                {/* Mapping Table */}
                <div className="overflow-x-auto">
                  {isLoadingMappings ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
                      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading mappings...</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Brand</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Market</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {brandMarketMapping.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-12 text-gray-500 dark:text-gray-400">
                              No brand market mappings found. Click "Add Mapping" to create one.
                            </td>
                          </tr>
                        ) : (
                          brandMarketMapping
                            .filter(mapping => 
                              mapping.brand.toLowerCase().includes(mappingSearch.toLowerCase()) ||
                              mapping.market.toLowerCase().includes(mappingSearch.toLowerCase())
                            )
                            .map((mapping) => (
                          <tr key={mapping.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">{mapping.brand}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{mapping.market}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                mapping.status === 'Active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                              }`}>
                                {mapping.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedMapping(mapping)
                                    setIsEditMappingModalOpen(true)
                                  }}
                                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedMapping(mapping)
                                    setIsDeleteMappingModalOpen(true)
                                  }}
                                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeMenu === 'Profile Setting' && (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Forms */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900 space-y-6">
                      {/* Avatar Upload */}
                      <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 flex-shrink-0 group cursor-pointer">
                          <div className="w-24 h-24 rounded-full bg-gold-500 flex items-center justify-center">
                            <User className="w-12 h-12 text-gray-900" />
                          </div>
                          <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Pencil className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {session?.name || 'Admin User'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {session?.role || 'Admin'}
                          </p>
                        </div>
                      </div>

                      {/* Profile Information */}
                      <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={profileData.fullName}
                              onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                              disabled={!isEditingProfile}
                              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                                isEditingProfile
                                  ? 'bg-white dark:bg-dark-card border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white'
                                  : 'bg-gray-100 dark:bg-dark-surface border-gray-300 dark:border-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={profileData.email}
                              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                              disabled={!isEditingProfile}
                              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                                isEditingProfile
                                  ? 'bg-white dark:bg-dark-card border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white'
                                  : 'bg-gray-100 dark:bg-dark-surface border-gray-300 dark:border-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                              Username
                            </label>
                            <input
                              type="text"
                              value={profileData.username}
                              onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                              disabled={!isEditingProfile}
                              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                                isEditingProfile
                                  ? 'bg-white dark:bg-dark-card border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white'
                                  : 'bg-gray-100 dark:bg-dark-surface border-gray-300 dark:border-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                              Bio
                            </label>
                            <textarea
                              rows={3}
                              value={profileData.bio}
                              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                              disabled={!isEditingProfile}
                              placeholder="Tell us about yourself..."
                              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none ${
                                isEditingProfile
                                  ? 'bg-white dark:bg-dark-card border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white'
                                  : 'bg-gray-100 dark:bg-dark-surface border-gray-300 dark:border-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        {isEditingProfile ? (
                          <>
                            <button
                              onClick={() => {
                                setIsEditingProfile(false)
                                // Reset to original values
                                if (session) {
                                  setProfileData({
                                    fullName: session.name || '',
                                    email: session.email || '',
                                    username: session.username || '',
                                    bio: ''
                                  })
                                }
                              }}
                              className="px-6 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                // Save changes logic here
                                setIsEditingProfile(false)
                                showToast('Profile updated successfully!', 'success')
                              }}
                              className="px-6 py-2 bg-gold-500 text-gray-900 rounded-lg font-medium hover:bg-gold-600 transition-colors"
                            >
                              Save Changes
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setIsEditingProfile(true)}
                            className="px-6 py-2 bg-gold-500 text-gray-900 rounded-lg font-medium hover:bg-gold-600 transition-colors"
                          >
                            Edit Profile
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Security Section - Separate Card */}
                    <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security</h3>
                      <div className="space-y-3">
                        {/* Change Password */}
                        <button
                          onClick={() => setIsChangePasswordModalOpen(true)}
                          className="w-full flex items-center gap-4 p-4 bg-gray-100 dark:bg-dark-surface hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Change Password</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Update your password regularly</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </button>

                        {/* Two-Factor Authentication */}
                        <div className="w-full flex items-center gap-4 p-4 bg-gray-100 dark:bg-dark-surface rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Fingerprint className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enabled - Admin only feature</p>
                          </div>
                          <button
                            onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              is2FAEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                is2FAEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        {/* 2FA Security Code */}
                        <div className="w-full flex items-center gap-4 p-4 bg-gray-100 dark:bg-dark-surface rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">2FA Security Code</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set your 6-digit security code</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {securityCode ? (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 6 }).map((_, index) => (
                                  <div
                                    key={index}
                                    className="w-2 h-2 rounded-full bg-blue-500"
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 6 }).map((_, index) => (
                                  <div
                                    key={index}
                                    className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"
                                  />
                                ))}
                              </div>
                            )}
                            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <button
                              onClick={() => {
                                setTempSecurityCode(securityCode)
                                setIs2FACodeModalOpen(true)
                              }}
                              className="px-4 py-2 bg-gold-500 text-gray-900 rounded-lg font-medium hover:bg-gold-600 transition-colors text-sm"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Detail Cards */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Account Information Card */}
                    <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                          <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            Active
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Oct 2025</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Login</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Jan 19, 11:07 AM</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Account Type</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Administrator</p>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity Card */}
                    <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Updated profile</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Yesterday at 11:07 AM</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Logged in</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Yesterday at 11:07 AM</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-green-600 dark:text-green-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Account created</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Oct 23</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security Tips Card */}
                    <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Tips</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Use a strong password</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Combine letters, numbers, and symbols</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
                            <Lock className="w-4 h-4 text-gray-900" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Enable 2FA</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add an extra layer of security</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-gray-900" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Regular updates</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Keep your information up to date</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'User Management' && (
              <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Management</h2>
                  <button 
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="px-4 py-2 bg-gold-500 text-gray-900 rounded-lg font-medium hover:bg-gold-600 transition-colors flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Add User
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-100 dark:bg-dark-surface rounded-xl p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{usersList.length}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-dark-surface rounded-xl p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{usersList.filter(u => u.status === 'Active').length}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-dark-surface rounded-xl p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Inactive Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{usersList.filter(u => u.status === 'Inactive').length}</p>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, or role..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto">
                    {isLoadingUsers ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Role</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Last Login</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                                {usersList.length === 0 
                                  ? 'No users found. Click "Add User" to create one.'
                                  : 'No users match your search criteria.'
                                }
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center">
                                  <User className="w-4 h-4 text-gray-900" />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                user.status === 'Active'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{user.lastLogin}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    if (user.username === 'admin') {
                                      showToast('Default admin user cannot be edited', 'error')
                                      return
                                    }
                                    setSelectedUser(user)
                                    setIsEditUserModalOpen(true)
                                  }}
                                  disabled={user.username === 'admin'}
                                  className={`p-2 rounded-lg transition-colors ${
                                    user.username === 'admin'
                                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                  }`}
                                  title={user.username === 'admin' ? 'Default admin cannot be edited' : 'Edit User'}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (user.username === 'admin') {
                                      showToast('Default admin user cannot be deleted', 'error')
                                      return
                                    }
                                    setSelectedUser(user)
                                    setIsDeleteUserModalOpen(true)
                                  }}
                                  disabled={user.username === 'admin'}
                                  className={`p-2 rounded-lg transition-colors ${
                                    user.username === 'admin'
                                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                      : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                  }`}
                                  title={user.username === 'admin' ? 'Default admin cannot be deleted' : 'Delete User'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'Activity Log' && (
              <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-900">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Log</h2>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filter
                    </button>
                    <button className="px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export Log
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-100 dark:bg-dark-surface rounded-xl p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Activities</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{activities.length}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-dark-surface rounded-xl p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{activities.filter(a => a.timestamp.includes('hour')).length}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-dark-surface rounded-xl p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{activities.filter(a => a.timestamp.includes('hour') || a.timestamp.includes('day')).length}</p>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search activities by user, action, or target..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>

                  {/* Activity Log Table */}
                  <div className="overflow-x-auto">
                    {isLoadingActivities ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading activity logs...</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">User</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Action</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Target</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Timestamp</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">IP Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredActivities.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                                {activities.length === 0 
                                  ? 'No activity logs found.'
                                  : 'No activities match your search criteria.'
                                }
                              </td>
                            </tr>
                          ) : (
                            filteredActivities.map((activity) => (
                              <tr
                                key={activity.id}
                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center">
                                      <User className="w-4 h-4 text-gray-900" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{activity.user}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                    {activity.action}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{activity.target}</td>
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{activity.timestamp}</td>
                                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{activity.ip}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}
      </div>

      {/* Change Password Modal */}
      {isChangePasswordModalOpen && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setIsChangePasswordModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-900 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Change Password</h2>
              <button
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gold-100 dark:hover:bg-gold-500/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded p-1 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded p-1 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="px-6 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsChangePasswordModalOpen(false)
                  showToast('Password changed successfully!', 'success')
                }}
                className="px-6 py-2 bg-gold-500 text-gray-900 rounded-lg font-medium hover:bg-gold-600 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2FA Security Code Modal */}
      {is2FACodeModalOpen && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setIs2FACodeModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-900 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <Key className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2FA Security Code</h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Set your 6-digit security code</p>

            <div className="mb-6">
              <input
                type="text"
                maxLength={6}
                value={tempSecurityCode}
                onChange={(e) => setTempSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-center text-2xl font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 tracking-widest"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIs2FACodeModalOpen(false)}
                className="px-6 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSecurityCode(tempSecurityCode)
                  setIs2FACodeModalOpen(false)
                  showToast('2FA Security Code updated successfully!', 'success')
                }}
                className="px-6 py-2 bg-gold-500 text-gray-900 rounded-lg font-medium hover:bg-gold-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <AddUserForm 
              onClose={() => setIsAddUserModalOpen(false)}
              showPassword={showAddUserPassword}
              setShowPassword={setShowAddUserPassword}
              onSuccess={async (newUser) => {
                try {
                  const createdUser = await createUser({
                    fullName: newUser.fullName,
                    email: newUser.email,
                    username: newUser.username,
                    password: newUser.password,
                    role: newUser.role,
                    status: newUser.status,
                    created_by: session?.name || 'admin'
                  })
                  setUsersList([createdUser, ...usersList])
                  setIsAddUserModalOpen(false)
                  showToast(`User "${newUser.fullName}" added successfully!`, 'success')
                } catch (error) {
                  showToast(error.message || 'Failed to add user', 'error')
                }
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && selectedUser && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <EditUserForm 
              user={selectedUser}
              onClose={() => {
                setIsEditUserModalOpen(false)
                setSelectedUser(null)
              }}
              showPassword={showAddUserPassword}
              setShowPassword={setShowAddUserPassword}
              onSuccess={async (updatedUser) => {
                try {
                  // Check if trying to edit admin user
                  if (updatedUser.username === 'admin' || selectedUser?.username === 'admin') {
                    showToast('Default admin user cannot be edited', 'error')
                    setIsEditUserModalOpen(false)
                    setSelectedUser(null)
                    return
                  }
                  
                  const userData = await updateUser(updatedUser.id, {
                    fullName: updatedUser.name,
                    email: updatedUser.email,
                    username: updatedUser.username || updatedUser.email.split('@')[0],
                    password: updatedUser.password || undefined, // Only update if password provided
                    role: updatedUser.role,
                    status: updatedUser.status,
                    updated_by: session?.name || 'admin'
                  })
                  setUsersList(usersList.map(u => u.id === updatedUser.id ? userData : u))
                  setIsEditUserModalOpen(false)
                  setSelectedUser(null)
                  showToast(`User "${updatedUser.name}" updated successfully!`, 'success')
                } catch (error) {
                  showToast(error.message || 'Failed to update user', 'error')
                }
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Delete User Confirmation Modal */}
      {isDeleteUserModalOpen && selectedUser && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-900 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete User</h2>
              <button
                onClick={() => {
                  setIsDeleteUserModalOpen(false)
                  setSelectedUser(null)
                }}
                className="p-2 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete <span className="font-semibold">{selectedUser.name}</span>?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone. All user data will be permanently removed.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteUserModalOpen(false)
                  setSelectedUser(null)
                }}
                className="px-6 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
                <button
                  onClick={async () => {
                    if (!selectedUser) return
                    
                    // Check if trying to delete admin user
                    if (selectedUser.username === 'admin') {
                      showToast('Default admin user cannot be deleted', 'error')
                      setIsDeleteUserModalOpen(false)
                      setSelectedUser(null)
                      return
                    }
                    
                    try {
                      const userName = selectedUser.name
                      await deleteUser(selectedUser.id)
                      setUsersList(usersList.filter(u => u.id !== selectedUser.id))
                      setIsDeleteUserModalOpen(false)
                      showToast(`User "${userName}" deleted successfully!`, 'success')
                      setSelectedUser(null)
                    } catch (error) {
                      showToast(error.message || 'Failed to delete user', 'error')
                    }
                  }}
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Mapping Modal */}
      {isAddMappingModalOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-96 border border-gray-200 dark:border-gray-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Brand & Market Mapping</h2>
              <button
                onClick={() => setIsAddMappingModalOpen(false)}
                className="p-1 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  id="newBrand"
                  placeholder="Enter brand name"
                  className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Market
                </label>
                <select
                  id="newMarket"
                  className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="">Select market</option>
                  <option value="SGD">SGD</option>
                  <option value="MYR">MYR</option>
                  <option value="USC">USC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="newStatus"
                  className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsAddMappingModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const brandInput = document.getElementById('newBrand')
                    const marketInput = document.getElementById('newMarket')
                    const statusInput = document.getElementById('newStatus')
                    
                    if (brandInput?.value && marketInput?.value) {
                      try {
                        const brandName = brandInput.value.trim()
                        const newMapping = await createBrandMarketMapping({
                          brand: brandName,
                          market: marketInput.value,
                          status: statusInput?.value || 'Active',
                          created_by: session?.name || 'admin'
                        })
                        
                        setBrandMarketMapping([newMapping, ...brandMarketMapping])
                        showToast(`${brandName} added successfully`, 'success')
                        setIsAddMappingModalOpen(false)
                        
                        // Reset form
                        brandInput.value = ''
                        marketInput.value = ''
                        statusInput.value = 'Active'
                      } catch (error) {
                        showToast(error.message || 'Failed to add brand market mapping', 'error')
                      }
                    } else {
                      showToast('Please fill in all required fields', 'error')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gold-500 text-gray-900 rounded-lg font-medium hover:bg-gold-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Mapping Modal */}
      {isEditMappingModalOpen && selectedMapping && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-96 border border-gray-200 dark:border-gray-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Brand & Market Mapping</h2>
              <button
                onClick={() => {
                  setIsEditMappingModalOpen(false)
                  setSelectedMapping(null)
                }}
                className="p-1 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  id="editBrand"
                  defaultValue={selectedMapping.brand}
                  className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Market
                </label>
                <select
                  id="editMarket"
                  defaultValue={selectedMapping.market}
                  className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="SGD">SGD</option>
                  <option value="MYR">MYR</option>
                  <option value="USC">USC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="editStatus"
                  defaultValue={selectedMapping.status}
                  className="w-full px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsEditMappingModalOpen(false)
                    setSelectedMapping(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const brandInput = document.getElementById('editBrand')
                    const marketInput = document.getElementById('editMarket')
                    const statusInput = document.getElementById('editStatus')
                    
                    if (brandInput?.value && marketInput?.value && selectedMapping) {
                      try {
                        const updatedMapping = await updateBrandMarketMapping(selectedMapping.id, {
                          brand: brandInput.value.trim(),
                          market: marketInput.value,
                          status: statusInput?.value || 'Active',
                          updated_by: session?.name || 'admin'
                        })
                        
                        setBrandMarketMapping(brandMarketMapping.map(m => 
                          m.id === selectedMapping.id ? updatedMapping : m
                        ))
                        showToast('Mapping updated successfully', 'success')
                        setIsEditMappingModalOpen(false)
                        setSelectedMapping(null)
                      } catch (error) {
                        showToast(error.message || 'Failed to update mapping', 'error')
                      }
                    } else {
                      showToast('Please fill in all required fields', 'error')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gold-500 text-gray-900 rounded-lg font-medium hover:bg-gold-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Mapping Confirmation Modal */}
      {isDeleteMappingModalOpen && selectedMapping && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 w-96 border border-gray-200 dark:border-gray-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Mapping</h2>
              <button
                onClick={() => {
                  setIsDeleteMappingModalOpen(false)
                  setSelectedMapping(null)
                }}
                className="p-1 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete the mapping for <span className="font-semibold text-gray-900 dark:text-white">{selectedMapping.brand}</span> - <span className="font-semibold text-gray-900 dark:text-white">{selectedMapping.market}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsDeleteMappingModalOpen(false)
                    setSelectedMapping(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!selectedMapping) return
                    
                    try {
                      const brandName = selectedMapping.brand
                      await deleteBrandMarketMapping(selectedMapping.id)
                      setBrandMarketMapping(brandMarketMapping.filter(m => m.id !== selectedMapping.id))
                      showToast(`${brandName} deleted successfully`, 'success')
                      setIsDeleteMappingModalOpen(false)
                      setSelectedMapping(null)
                    } catch (error) {
                      showToast(error.message || 'Failed to delete mapping', 'error')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// Edit User Form Component
function EditUserForm({ user, onClose, showPassword, setShowPassword, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      fullName: user.name || user.fullName,
      email: user.email,
      username: user.username || (user.email ? user.email.split('@')[0] : ''),
      role: user.role,
      status: user.status,
    }
  })

  const onSubmit = (data) => {
    console.log('Updated user data:', data)
    if (onSuccess) {
      onSuccess({
        ...user,
        id: user.id,
        name: data.fullName,
        email: data.email,
        username: data.username,
        role: data.role,
        status: data.status,
        password: data.password || undefined, // Only include if provided
      })
    }
    // Don't close here, let parent handle it after API call
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit User</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            {...register('fullName', { required: 'Full name is required' })}
            className={`w-full px-4 py-2 bg-white dark:bg-dark-surface border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            }`}
            placeholder="Enter full name"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className={`w-full px-4 py-2 bg-white dark:bg-dark-surface border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            }`}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username *
          </label>
          <input
            type="text"
            {...register('username', { 
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters'
              }
            })}
            className={`w-full px-4 py-2 bg-white dark:bg-dark-surface border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            }`}
            placeholder="Enter username"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
          )}
        </div>

        {/* Password (Optional for Edit) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password (Leave blank to keep current password)
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { 
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
              className={`w-full px-4 py-2 pr-10 bg-white dark:bg-dark-surface border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              }`}
              placeholder="Enter new password (optional)"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Role *
          </label>
          <select
            {...register('role', { required: 'Role is required' })}
            className={`w-full px-4 py-2 bg-white dark:bg-dark-surface border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.role ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            <option value="">Select role</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="User">User</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status *
          </label>
          <select
            {...register('status', { required: 'Status is required' })}
            className={`w-full px-4 py-2 bg-white dark:bg-dark-surface border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.status ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            <option value="">Select status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-gold-500 text-gray-900 rounded-lg font-medium hover:bg-gold-600 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </>
  )
}

// Add User Form Component
function AddUserForm({ onClose, showPassword, setShowPassword, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = (data) => {
    console.log('Form data:', data)
    if (onSuccess) {
      onSuccess(data)
    }
    onClose()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New User</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            {...register('fullName', { required: 'Full name is required' })}
            className={`w-full px-4 py-2 bg-white dark:bg-dark-surface border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            }`}
            placeholder="Enter full name"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className={`w-full px-4 py-2 bg-white dark:bg-dark-surface border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            }`}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username *
          </label>
          <input
            type="text"
            {...register('username', { 
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters'
              }
            })}
            className={`w-full px-4 py-2 bg-white dark:bg-dark-surface border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            }`}
            placeholder="Enter username"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
              className={`w-full px-4 py-2 pr-10 bg-white dark:bg-dark-surface border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              }`}
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Role *
          </label>
          <select
            {...register('role', { required: 'Role is required' })}
            className={`w-full px-4 py-2 bg-white dark:bg-dark-surface border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.role ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            <option value="">Select role</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="User">User</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status *
          </label>
          <select
            {...register('status', { required: 'Status is required' })}
            className={`w-full px-4 py-2 bg-white dark:bg-dark-surface border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 ${
              errors.status ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            <option value="">Select status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-gold-500 text-gray-900 rounded-lg font-medium hover:bg-gold-600 transition-colors"
          >
            Add User
          </button>
        </div>
      </form>
    </>
  )
}
