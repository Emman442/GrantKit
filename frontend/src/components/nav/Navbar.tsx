import React, { useState } from 'react';
import { Sun, Moon, Copy, Check, ChevronDown, Menu, X, Wallet, Shield } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '@/lib/genlayer/wallet';
import { truncateAddress } from '../../utils/format';
import { Button } from '../ui/Button';
import { copyAddress } from '@/src/utils/copyAddress';

export type PageId = 'overview' | 'apply' | 'my-grant' | 'proposals' | 'admin';

interface NavbarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const {
    address,
    isConnected,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isOwner = address === import.meta.env.VITE_ADMIN_ADDRESS?.toLowerCase();

  const handleCopy = async () => {
  const ok = await copyAddress(address?? "");
  if (!ok) return;
  setCopied(true);
  window.setTimeout(() => setCopied(false), 2000);
};

  const navItems: { id: PageId; label: string; ownerOnly?: boolean }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'apply', label: 'Apply' },
    { id: 'my-grant', label: 'My Grant' },
    { id: 'proposals', label: 'All Proposals' },
    { id: 'admin', label: 'Admin', ownerOnly: true },
  ];

  return (
    <header className="sticky top-0 z-40 h-[56px] w-full border-b border-[var(--border-app)] bg-[var(--bg-app)] select-none">
      <div className="max-w-[1120px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate('overview')}
            className="text-base font-bold tracking-tight text-[var(--text-app)] hover:opacity-85 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-[#3B6CFF]"
            aria-label="GrantKit Home"
          >
            GrantKit
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              if (item.ownerOnly && !isOwner) return null;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-xs font-medium transition-colors relative py-1 cursor-pointer ${
                    isActive
                      ? 'text-[#3B6CFF] font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-app)]'
                  }`}
                >
                  {item.label}
                  {item.ownerOnly && (
                    <span className="ml-1 text-[10px] text-[#C9932B] font-mono">[Owner]</span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-[#3B6CFF]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Zone: Network Pill, Theme Toggle, Wallet Button */}
        <div className="flex items-center gap-3">
          {/* Network Pill (Radius 999px status pill) */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[999px] border border-[var(--border-app)] bg-[var(--bg-surface-raised)] text-[11px] font-mono text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
            <span>Genlayer Studio</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-[36px] h-[36px] rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-app)] hover:bg-[var(--bg-surface-raised)] transition-colors flex items-center justify-center cursor-pointer"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun size={16} strokeWidth={1.5} />
            ) : (
              <Moon size={16} strokeWidth={1.5} />
            )}
          </button>

          {/* Connect / Address Button with Account Switcher */}
          <div className="relative">
            {isConnected && address ? (
              <div className="flex items-center">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="h-[36px] px-2.5 rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface)] text-[var(--text-app)] hover:bg-[var(--bg-surface-raised)] transition-colors flex items-center gap-2 cursor-pointer font-mono text-xs tabular-nums"
                  aria-expanded={accountMenuOpen}
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                  <span>{truncateAddress(address, 6, 6)}</span>
                  <ChevronDown size={14} strokeWidth={1.5} className="text-[var(--text-muted)]" />
                </button>
              </div>
            ) : (
              <Button onClick={() => connectWallet()} size="md" variant="primary">
                Connect Wallet
              </Button>
            )}

            {/* Account Switcher Dropdown */}
            {accountMenuOpen && isConnected && (
              <div
                className="absolute right-0 mt-1.5 w-72 rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] text-[var(--text-app)] shadow-[0_8px_24px_rgb(0,0,0,0.35)] p-2 z-50 text-xs"
                onMouseLeave={() => setAccountMenuOpen(false)}
              >
                <div className="p-2 border-b border-[var(--border-app)] mb-1 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[11px] text-[var(--text-muted)] block">Active Wallet</span>
                    <span className="font-mono text-xs text-[var(--text-app)] truncate block">
                      {address}
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-app)] hover:bg-[var(--bg-surface-raised)] shrink-0"
                    title="Copy full address"
                  >
                    {copied ? <Check size={14} className="text-[var(--color-success)]" /> : <Copy size={14} strokeWidth={1.5} />}
                  </button>
                </div>

                {/* <div className="py-1">
                  <span className="px-2 text-[10px] uppercase font-semibold text-[var(--text-faint)] tracking-wider block mb-1">
                    Switch Test Profile
                  </span>
                  {availableAccounts.map((acc) => {
                    const isCurrent = address?.toLowerCase() === acc.address.toLowerCase();
                    return (
                      <button
                        key={acc.address}
                        onClick={() => {
                          switchAccount(acc.address);
                          setAccountMenuOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-[4px] transition-colors flex flex-col ${
                          isCurrent
                            ? 'bg-[var(--bg-surface-raised)] border border-[var(--border-app)]'
                            : 'hover:bg-[var(--bg-surface-raised)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-[var(--text-app)]">
                            {acc.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] text-[#3B6CFF] font-medium">Active</span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] leading-tight">
                          {acc.role}
                        </span>
                      </button>
                    );
                  })}
                </div> */}

                <div className="pt-2 border-t border-[var(--border-app)] mt-1">
                  <button
                    onClick={() => {
                      disconnectWallet();
                      setAccountMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-[#D2554D] hover:bg-[var(--bg-surface-raised)] rounded-[4px] transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-[36px] h-[36px] rounded-[6px] border border-[var(--border-app)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-app)] flex items-center justify-center cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--border-app)] bg-[var(--bg-surface)] px-4 py-3 space-y-2">
          {navItems.map((item) => {
            if (item.ownerOnly && !isOwner) return null;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-[6px] text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#3B6CFF] text-white font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-app)] hover:bg-[var(--bg-surface-raised)]'
                }`}
              >
                {item.label}
                {item.ownerOnly && <span className="ml-1 text-[10px] text-[#C9932B]">[Owner]</span>}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
