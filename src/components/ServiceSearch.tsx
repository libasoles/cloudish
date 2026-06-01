import { useState, useRef, useEffect } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AWS_SERVICES, type AwsService } from '@/data/aws-services';
import { AwsServiceIcon } from '@/components/AwsServiceIcon';
import {
  UI_TEXT,
  getBrowserLocale,
  getCategoryLabel,
  getServiceDescription,
  type Locale,
} from '@/i18n';

function getSearchResults(query: string, locale: Locale) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return [];
  }

  return AWS_SERVICES.filter(
    (service) => {
      const categoryLabel = getCategoryLabel(service.category, locale);
      const description = getServiceDescription(service, locale);

      return (
        service.name.toLowerCase().includes(normalizedQuery) ||
        service.category.toLowerCase().includes(normalizedQuery) ||
        categoryLabel.toLowerCase().includes(normalizedQuery) ||
        description.toLowerCase().includes(normalizedQuery)
      );
    }
  ).slice(0, 8);
}

export default function ServiceSearch() {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale];
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addNodes, screenToFlowPosition } = useReactFlow();

  const results = getSearchResults(query, locale);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  function addServiceNode(service: AwsService) {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    addNodes({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'awsService',
      position,
      data: {
        name: service.name,
        slug: service.slug,
        category: service.category,
        serviceId: service.id,
      },
    });
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }

  function handleQueryChange(value: string) {
    const nextResults = getSearchResults(value, locale);

    setQuery(value);
    setActiveIndex(-1);
    setOpen(nextResults.length > 0);
  }

  function clearSearch() {
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) addServiceNode(results[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      clearSearch();
      inputRef.current?.blur();
    }
  }

  return (
    <Panel position="top-center">
      <div className="relative mt-2" ref={containerRef}>
        <div className="flex w-72 items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-card-foreground shadow-md">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-sm text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={t.clearSearch}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {open && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
            {results.map((service, i) => (
              <li
                key={service.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-3 py-2 text-sm',
                  i === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addServiceNode(service);
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <AwsServiceIcon
                  slug={service.slug}
                  category={service.category}
                  name={service.name}
                  size={24}
                />
                <span className="font-medium text-foreground">{service.name}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {getCategoryLabel(service.category, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
