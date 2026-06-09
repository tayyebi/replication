import { useState } from 'react';

interface Props {
  workingFiles: Record<string, string>;
  staged: Record<string, string>;
  onEdit: (path: string, content: string) => void;
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
}

export function GitWorkspace({ workingFiles, staged, onEdit, onStage, onUnstage }: Props) {
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  function startEdit(path: string) {
    setEditingFile(path);
    setEditContent(workingFiles[path] || '');
  }

  function saveEdit() {
    if (editingFile) {
      onEdit(editingFile, editContent);
      setEditingFile(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Working Directory */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <h3 className="text-sm font-bold text-slate-700 mb-2">📝 Working Directory</h3>
        {Object.keys(workingFiles).length === 0 ? (
          <p className="text-xs text-slate-400 italic">No files</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(workingFiles).map(([path, content]) => {
              const isStaged = path in staged;
              return (
                <div key={path} className={`rounded-lg border p-2 ${isStaged ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                  {editingFile === path ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-slate-600">{path}</span>
                        <button onClick={saveEdit}
                          className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-md font-semibold hover:bg-indigo-500 active:scale-95"
                        >Save</button>
                      </div>
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full text-xs font-mono p-1.5 border border-slate-300 rounded-md bg-white resize-y focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        rows={4}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-mono font-semibold text-slate-600 truncate">{path}</span>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => startEdit(path)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-semibold"
                          >✏️</button>
                          {!isStaged && (
                            <button onClick={() => onStage(path)}
                              className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-md font-semibold"
                            >+ Stage</button>
                          )}
                        </div>
                      </div>
                      <pre className="text-xs text-slate-500 mt-1 font-mono whitespace-pre-wrap line-clamp-3">{content}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Staging Area */}
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        <h3 className="text-sm font-bold text-slate-700 mb-2">📦 Staging Area</h3>
        {Object.keys(staged).length === 0 ? (
          <p className="text-xs text-slate-400 italic">Nothing staged. Edit a file and stage it.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(staged).map(([path, content]) => (
              <div key={path} className="rounded-lg border border-emerald-300 bg-emerald-50 p-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-mono font-semibold text-emerald-800 truncate">{path}</span>
                  <button onClick={() => onUnstage(path)}
                    className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 px-2 py-0.5 rounded-md font-semibold flex-shrink-0"
                  >− Unstage</button>
                </div>
                <pre className="text-xs text-emerald-700 mt-1 font-mono whitespace-pre-wrap line-clamp-3">{content}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
