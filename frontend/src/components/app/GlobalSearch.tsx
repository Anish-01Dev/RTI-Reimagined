import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchCases } from "@/domain/store";
import type { CaseRecord } from "@/domain/types";

/** Global search across both shells — Suchna ID, subject, authority,
 * department and citizen name over the local case store. Cmd/Ctrl-K
 * focuses it; Enter opens the top hit. */
export function GlobalSearch({
  placeholder,
  basePath,
  dark = false,
}: {
  placeholder: string;
  basePath: string;
  dark?: boolean;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results: CaseRecord[] = query.trim()
    ? searchCases(query).slice(0, 7)
    : [];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  function go(record: CaseRecord) {
    setOpen(false);
    setQuery("");
    navigate(`${basePath}/${record.suchnaId}`);
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-sm">
      <div
        className={`flex items-center gap-2 h-9 px-2.5 rounded-md border ${
          dark
            ? "bg-white/5 border-gov-line text-gov-ink"
            : "bg-panel-2 border-line-2 text-ink"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[18px] ${dark ? "text-gov-ink-3" : "text-ink-3"}`}
        >
          search
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown")
              setActive((a) => Math.min(a + 1, results.length - 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            if (e.key === "Enter" && results[active]) go(results[active]);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className={`bg-transparent outline-none flex-1 text-[13px] ${
            dark
              ? "placeholder:text-gov-ink-3"
              : "placeholder:text-ink-3"
          }`}
        />
        <kbd
          className={`hidden md:inline text-[10px] font-mono px-1 rounded border ${
            dark
              ? "border-gov-line text-gov-ink-3"
              : "border-line-2 text-ink-3"
          }`}
        >
          ⌘K
        </kbd>
      </div>

      {open && query.trim() && (
        <div
          className={`absolute mt-1.5 w-[min(28rem,90vw)] rounded-lg border shadow-raised overflow-hidden z-40 ${
            dark ? "bg-gov-panel border-gov-line" : "bg-panel border-line"
          }`}
        >
          {results.length === 0 ? (
            <p
              className={`px-3 py-5 text-center text-[12.5px] ${dark ? "text-gov-ink-3" : "text-ink-3"}`}
            >
              No cases match “{query}”.
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.suchnaId}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={`w-full text-left px-3 py-2 flex items-center gap-3 ${
                  i === active
                    ? dark
                      ? "bg-white/10"
                      : "bg-primary-wash"
                    : ""
                }`}
              >
                <span
                  className={`mono shrink-0 ${dark ? "text-gov-ink-3" : "text-ink-3"}`}
                >
                  {r.suchnaId}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium truncate">
                    {r.subject}
                  </span>
                  <span
                    className={`block text-[11.5px] truncate ${dark ? "text-gov-ink-3" : "text-ink-3"}`}
                  >
                    {r.authorityName}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
