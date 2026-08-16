import React from 'react';
import { Link as LinkIcon } from 'lucide-react';

export interface ResourceLink { title?: string; url: string }

interface Props {
  links?: ResourceLink[] | null;
  className?: string;
  compact?: boolean;
}

/** Renders a list of external links attached to a resource. */
export const ResourceLinks: React.FC<Props> = ({ links, className = '', compact = false }) => {
  if (!Array.isArray(links) || links.length === 0) return null;
  const valid = links.filter(l => l && l.url);
  if (valid.length === 0) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      {valid.map((link, idx) => (
        <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'} text-rainbow-purple hover:underline`}>
          <LinkIcon className={compact ? 'w-3 h-3 shrink-0' : 'w-4 h-4 shrink-0'} />
          <span className="truncate">{link.title || link.url}</span>
        </a>
      ))}
    </div>
  );
};

export default ResourceLinks;
