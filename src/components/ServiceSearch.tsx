import { useState, useRef, useEffect } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AWS_SERVICES, type AwsService } from '@/data/aws-services';
import { AwsServiceIcon } from '@/components/AwsServiceIcon';

function getSearchResults(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return [];
  }

  return AWS_SERVICES.filter(
    (service) =>
      service.name.toLowerCase().includes(normalizedQuery) ||
      service.category.toLowerCase().includes(normalizedQuery)
  ).slice(0, 8);
}

export default function ServiceSearch() {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addNodes, screenToFlowPosition } = useReactFlow();

  const results = getSearchResults(query);

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
      },
    });
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }

  function handleQueryChange(value: string) {
    const nextResults = getSearchResults(value);

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
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2 w-72">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search AWS services..."
            className="flex-1 text-sm outline-none bg-transparent"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {open && results.length > 0 && (
          <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto max-h-64 z-50">
            {results.map((service, i) => (
              <li
                key={service.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 cursor-pointer text-sm',
                  i === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
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
                <span className="font-medium text-gray-800">{service.name}</span>
                <span className="ml-auto text-xs text-gray-400 shrink-0">{service.category}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
