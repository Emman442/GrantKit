import React from 'react';
import { PageId } from '../nav/Navbar';
import { ExternalLink } from 'lucide-react';
import { truncateAddress } from '../../utils/format';

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  
  return (
    <footer className="w-full border-t border-[var(--border-app)] bg-[var(--bg-app)] py-8 text-xs text-[var(--text-muted)] select-none">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <span className="font-semibold text-[var(--text-app)]">GrantKit</span>
          <span className="hidden sm:inline text-[var(--border-app)]">|</span>
          <span>Intelligent Grants on GenLayer</span>
          <span className="hidden sm:inline text-[var(--border-app)]">|</span>
  
        </div>

        <div className="flex items-center gap-5 text-xs">
          <button
            onClick={() => onNavigate('overview')}
            className="hover:text-[var(--text-app)] transition-colors"
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('apply')}
            className="hover:text-[var(--text-app)] transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => onNavigate('proposals')}
            className="hover:text-[var(--text-app)] transition-colors"
          >
            Proposals
          </button>
          <a
            href="https://docs.genlayer.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-[var(--text-app)] transition-colors"
          >
            <span>GenLayer Docs</span>
            <ExternalLink size={12} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </footer>
  );
};
