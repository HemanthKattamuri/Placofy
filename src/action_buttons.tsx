              <button
                type="button"
                id="btn-ats-suite"
                onClick={() => {
                  setViewMode("ats");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border flex items-center justify-center gap-2 cursor-pointer shadow-xs w-full sm:w-auto transform active:scale-95 transition-all duration-200 hover:-translate-y-0.5 ${viewMode === "ats"
                  ? "text-white bg-gradient-to-r from-indigo-600 to-violet-600 border-transparent hover:from-indigo-500 hover:to-violet-500 hover:shadow-md hover:shadow-indigo-100"
                  : "text-slate-700 bg-white border-slate-200 hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-200"
                  }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Resume &amp; ATS Suite</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPasteOpen(true)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border flex items-center justify-center gap-2 cursor-pointer shadow-xs w-full sm:w-auto transform active:scale-95 transition-all duration-200 hover:-translate-y-0.5 text-slate-700 bg-white border-slate-200 hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-200`}
              >
                <ClipboardPaste className="h-4 w-4" />
                <span>Paste Job Description</span>
              </button>

              <button
                type="button"
                id="btn-add-application"
                onClick={openNewApplicationModal}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 hover:-translate-y-0.5"
                title="Add Application"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>

