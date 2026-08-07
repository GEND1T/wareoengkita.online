import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  PackageCheck,
  Wallet,
  MoreHorizontal,
} from 'lucide-react';
import type { AdminTab } from '../store/useAdminStore';

interface MobileBottomNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onMorePress: () => void;
  unreadOrdersCount: number;
}

interface NavItem {
  id: AdminTab | 'more';
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  badge?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onMorePress,
  unreadOrdersCount,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Beranda',
      icon: <LayoutDashboard className="w-[22px] h-[22px] stroke-[1.5]" />,
      activeIcon: <LayoutDashboard className="w-[22px] h-[22px] stroke-[2.5]" />,
    },
    {
      id: 'orders',
      label: 'Pesanan',
      icon: <ShoppingBag className="w-[22px] h-[22px] stroke-[1.5]" />,
      activeIcon: <ShoppingBag className="w-[22px] h-[22px] stroke-[2.5]" />,
      badge: unreadOrdersCount,
    },
    {
      id: 'products',
      label: 'Produk',
      icon: <PackageCheck className="w-[22px] h-[22px] stroke-[1.5]" />,
      activeIcon: <PackageCheck className="w-[22px] h-[22px] stroke-[2.5]" />,
    },
    {
      id: 'wallet_pencairan',
      label: 'Keuangan',
      icon: <Wallet className="w-[22px] h-[22px] stroke-[1.5]" />,
      activeIcon: <Wallet className="w-[22px] h-[22px] stroke-[2.5]" />,
    },
    {
      id: 'more',
      label: 'Lainnya',
      icon: <MoreHorizontal className="w-[22px] h-[22px] stroke-[1.5]" />,
      activeIcon: <MoreHorizontal className="w-[22px] h-[22px] stroke-[2.5]" />,
    },
  ];

  // Determine if "more" tab is implicitly active
  const primaryTabs: AdminTab[] = ['overview', 'orders', 'products', 'wallet_pencairan'];
  const isMoreActive = !primaryTabs.includes(activeTab);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-[2600] bg-white/95 backdrop-blur-xl border-t border-gray-200/80 safe-area-bottom">
      <div className="flex items-stretch justify-around h-[60px] max-w-lg mx-auto">
        {navItems.map((item) => {
          const isMore = item.id === 'more';
          const isActive = isMore ? isMoreActive : activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (isMore) {
                  onMorePress();
                } else {
                  onTabChange(item.id as AdminTab);
                }
              }}
              className={`
                relative flex flex-col items-center justify-center gap-0.5 flex-1
                min-w-0 transition-colors duration-200 active:scale-95
                ${isActive
                  ? 'text-[#063104]'
                  : 'text-gray-400 hover:text-gray-600'
                }
              `}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute top-0 inset-x-3 h-[2.5px] rounded-full bg-[#063104]" />
              )}

              {/* Icon with badge */}
              <span className="relative">
                {isActive ? item.activeIcon : item.icon}

                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-extrabold rounded-full px-1 ring-2 ring-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>

              {/* Label */}
              <span className={`text-[10px] leading-tight truncate max-w-full px-1 ${isActive ? 'font-extrabold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
