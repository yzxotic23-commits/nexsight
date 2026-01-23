'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  CreditCard,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Receipt,
} from 'lucide-react'
import { useUIStore } from '@/lib/stores/uiStore'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { 
    name: 'Transaction', 
    icon: Receipt,
    submenu: [
      { name: 'Deposit Monitor', href: '/dashboard/deposit', icon: ArrowDownCircle },
      { name: 'Withdraw Monitor', href: '/dashboard/withdraw', icon: ArrowUpCircle },
    ]
  },
  { name: 'Bank Account Rental', href: '/dashboard/wealth', icon: Users },
  { name: 'Wealth+ Accounts', href: '/dashboard/bank', icon: CreditCard },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, sidebarCollapsed, toggleSidebarCollapse } = useUIStore()
  const [expandedMenus, setExpandedMenus] = useState([])

  // Check if Transaction submenu should be expanded (if any submenu item is active)
  const isTransactionActive = pathname?.includes('/dashboard/deposit') || pathname?.includes('/dashboard/withdraw')
  const [transactionExpanded, setTransactionExpanded] = useState(isTransactionActive)

  const toggleSubmenu = (menuName) => {
    if (menuName === 'Transaction') {
      setTransactionExpanded(!transactionExpanded)
    } else {
      setExpandedMenus(prev => 
        prev.includes(menuName) 
          ? prev.filter(m => m !== menuName)
          : [...prev, menuName]
      )
    }
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-light-card dark:bg-dark-card rounded-lg shadow-lg"
      >
        {sidebarOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <Menu className="w-6 h-6 text-foreground" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen lg:h-full bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-900 z-40 transform transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'w-20 lg:w-20' : 'w-72 lg:w-72'}`}
      >
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'p-3' : 'p-6'}`}>
          <div className={`flex items-center mb-8 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!sidebarCollapsed && (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">NexSight</h2>
            )}
            <button
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-2 hover:bg-gold-100 dark:hover:bg-gold-500/20 rounded-lg transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <GripVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              
              // Handle items with submenu
              if (item.submenu) {
                const isExpanded = item.name === 'Transaction' ? transactionExpanded : expandedMenus.includes(item.name)
                const hasActiveSubmenu = item.submenu.some(subItem => 
                  pathname === subItem.href || pathname?.startsWith(subItem.href + '/')
                )
                
                // Don't show submenu when collapsed
                if (sidebarCollapsed) {
                  return (
                    <button
                      key={item.name}
                      onClick={() => !sidebarCollapsed && toggleSubmenu(item.name)}
                      className={`w-full flex items-center justify-center px-3 py-3 rounded-xl transition-all duration-200 ${
                        hasActiveSubmenu
                          ? 'bg-gold-500 text-black shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gold-100 dark:hover:bg-gold-500/20'
                      }`}
                      title={item.name}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${hasActiveSubmenu ? 'text-black' : ''}`} />
                    </button>
                  )
                }
                
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleSubmenu(item.name)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        hasActiveSubmenu
                          ? 'bg-gold-500 text-black shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gold-100 dark:hover:bg-gold-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Icon className={`w-5 h-5 flex-shrink-0 ${hasActiveSubmenu ? 'text-black' : ''}`} />
                        <span className={`font-medium text-base whitespace-nowrap ${hasActiveSubmenu ? 'text-black' : ''}`}>{item.name}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className={`w-4 h-4 flex-shrink-0 ${hasActiveSubmenu ? 'text-black' : ''}`} />
                      ) : (
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${hasActiveSubmenu ? 'text-black' : ''}`} />
                      )}
                    </button>
                    {isExpanded && !sidebarCollapsed && (
                      <div className="ml-4 mt-2 space-y-2">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = pathname === subItem.href || pathname?.startsWith(subItem.href + '/')
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                isSubActive
                                  ? 'bg-gold-500 text-black shadow-md'
                                  : 'text-gray-600 dark:text-gray-300 hover:bg-gold-100 dark:hover:bg-gold-500/20'
                              }`}
                            >
                              <SubIcon className={`w-5 h-5 flex-shrink-0 ${isSubActive ? 'text-black' : ''}`} />
                              <span className={`font-medium text-base whitespace-nowrap ${isSubActive ? 'text-black' : ''}`}>{subItem.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              // Handle regular menu items
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard' || pathname === '/dashboard/'
                  : pathname === item.href || (pathname?.startsWith(item.href + '/') && !pathname?.includes('/deposit') && !pathname?.includes('/withdraw'))
              
              // Collapsed view - only icon
              if (sidebarCollapsed) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`w-full flex items-center justify-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gold-500 text-black shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gold-100 dark:hover:bg-gold-500/20'
                    }`}
                    title={item.name}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-black' : ''}`} />
                  </Link>
                )
              }
              
              // Expanded view - icon + text
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gold-500 text-black shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gold-100 dark:hover:bg-gold-500/20'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-black' : ''}`} />
                  <span className={`font-medium text-base whitespace-nowrap ${isActive ? 'text-black' : ''}`}>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  )
}
