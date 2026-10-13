import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Command, Search } from 'lucide-react';

const CommandPalette = ({ isOpen, onClose, commands }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCommands = commands.filter((command) =>
    `${command.label} ${command.keywords || ''}`.toLowerCase().includes(normalizedQuery)
  );

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setQuery('');
        onClose(true);
      }
      if (event.key === 'Escape') onClose(false);
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const runCommand = (command) => {
    command.run();
    onClose(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/40 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose(false);
      }}
    >
      <section role="dialog" aria-modal="true" aria-label="Command palette" className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="h-4 w-4 shrink-0 text-indigo-600" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && filteredCommands[0]) runCommand(filteredCommands[0]);
            }}
            placeholder="Search pages and actions..."
            className="h-14 min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-500">ESC</kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {filteredCommands.length ? filteredCommands.map((command) => {
            const Icon = command.icon || ArrowRight;
            return (
              <button
                type="button"
                key={command.label}
                onClick={() => runCommand(command)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 focus:bg-indigo-50 focus:outline-none"
              >
                <span className="rounded-lg bg-slate-100 p-2 text-slate-600"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{command.label}</span>
                  {command.description && <span className="mt-0.5 block truncate text-xs text-slate-500">{command.description}</span>}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            );
          }) : (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No matching commands.</p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><Command className="h-3 w-3" /> K to search</span>
          <span>Enter to open</span>
        </div>
      </section>
    </div>
  );
};

export default CommandPalette;