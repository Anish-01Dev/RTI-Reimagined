import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchCases } from "@/domain/store";
import type { CaseRecord } from "@/domain/types";

/** One search implementation, used by both the citizen and government
 * shells — searches Suchna ID, subject, authority, department, citizen
 * name across the local case store. */
export function SearchBox({
  placeholder,
  basePath = "/app/cases",
}: {
  placeholder: string;
  basePath?: string;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // searchCases is a synchronous, pure read of localStorage — derived
  // directly during render rather than mirrored into state via an effect.
  const results: CaseRecord[] = query.trim() ? searchCases(query).slice(0, 6) : [];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-xs bg-surface-container-low border border-outline-variant rounded-lg px-sm h-10">
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
          search
        </span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="bg-transparent outline-none flex-1 text-body-sm text-on-surface placeholder-on-surface-variant/70"
          aria-label="Search"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute mt-1 w-full bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg z-50 overflow-hidden">
          {results.map((r) => (
            <button
              key={r.suchnaId}
              onClick={() => {
                setOpen(false);
                setQuery("");
                navigate(`${basePath}/${r.suchnaId}`);
              }}
              className="w-full text-left px-md py-sm hover:bg-surface-container transition-colors flex flex-col"
            >
              <span className="text-body-sm font-medium text-on-surface">
                {r.subject}
              </span>
              <span className="text-label-caps text-label-caps text-on-surface-variant">
                {r.suchnaId} · {r.authorityName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
