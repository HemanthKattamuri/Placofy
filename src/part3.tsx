            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex-1 w-full mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Bar Banner: Dashboard Statistics */}
        {viewMode !== "ats" && (
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 shrink-0" id="dashboard-stats-section">
            {/* Stat Item 1 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm aspect-square flex flex-col justify-center items-center text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</p>
              <p className="text-3xl font-bold mt-2 text-slate-900 font-mono">{stats.total}</p>
            </div>

            {/* Stat Item 2 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm aspect-square flex flex-col justify-center items-center text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Response Rate</p>
              <p className="text-3xl font-bold mt-2 text-blue-600 font-mono">{stats.responseRate}</p>
            </div>

            {/* Stat Item 3 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm aspect-square flex flex-col justify-center items-center text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interview Conversion</p>
              <p className="text-3xl font-bold mt-2 text-purple-600 font-mono">{stats.interviewRate}</p>
            </div>

            {/* Stat Item 4 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-red-500 aspect-square flex flex-col justify-center items-center text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Needs Follow-up</p>
              <p className="text-3xl font-bold mt-2 text-red-600 font-mono flex flex-col items-center">
                {stats.needsFollowUpCount} <span className="text-xs font-normal text-slate-400 mt-1">&gt;14 days</span>
              </p>
            </div>
          </section>
        )}

        {/* View Switcher, Filtering, Search Controls */}
        {viewMode !== "ats" && (
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" id="view-controls">
            {/* Search bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="search-input"
                placeholder="Search by company, role, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status filtering dropdown (table and general helper) */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  id="filter-status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  {COLUMNS.map((col) => (
                    <option key={col.status} value={col.status}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        )}

        {/* Dynamic Main Views Content */}
        <AnimatePresence mode="wait">
          {viewMode === "kanban" ? (
            <motion.div
              key="kanban-board"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${COLUMNS.filter((col) => !statusFilter || col.status === statusFilter).length === 1 ? "lg:grid-cols-1 max-w-md mx-auto w-full" :
                COLUMNS.filter((col) => !statusFilter || col.status === statusFilter).length === 2 ? "lg:grid-cols-2 max-w-3xl mx-auto w-full" :
                  COLUMNS.filter((col) => !statusFilter || col.status === statusFilter).length === 3 ? "lg:grid-cols-3" :
                    COLUMNS.filter((col) => !statusFilter || col.status === statusFilter).length === 4 ? "lg:grid-cols-4" :
                      "lg:grid-cols-5"
                } items-start`}
              id="kanban-view"
            >
              {COLUMNS.filter((col) => !statusFilter || col.status === statusFilter).map((column) => {
                const filteredApps = sortedAndFilteredApplications.filter((app) => app.status === column.status);

                return (
                  <div
                    key={column.status}
                    className={`rounded-2xl border ${column.border} ${column.bg} p-4 flex flex-col h-full min-h-[500px] shadow-sm`}
                    id={`kanban-col-${column.status.replace("/", "-")}`}
                  >
                    {/* Column Header */}
                    <div className="mb-4 flex items-center justify-between pb-2 border-b border-slate-200/50">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
                        <h3 className="font-display font-bold text-slate-800 text-sm tracking-wide">
                          {column.title}
                        </h3>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold font-mono ${column.lightBg} ${column.text}`}>
                        {filteredApps.length}
                      </span>
                    </div>

                    {/* Column Items list */}
                    <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-[70vh]">
                      {filteredApps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/60 p-6 text-center text-slate-400">
                          <p className="text-xs">No items found</p>
                        </div>
                      ) : (
                        filteredApps.map((app) => {
                          const hasDeadlineAlert = isDeadlineClose(app);
                          const hasNeedsFollowUp = needsFollowUp(app);

                          // Style variables based on the "Sleek Interface" theme instructions
                          let wrapperClass = "group relative rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between border cursor-grab active:cursor-grabbing";
                          let topBadgeText = "";
                          let topBadgeClass = "text-xs font-medium text-slate-400";

                          if (app.status === "Applied") {
                            wrapperClass += " bg-white border-slate-200 hover:border-indigo-300";
                            topBadgeText = `${app.source === "Other" && app.customSource ? app.customSource : app.source} • ${getDaysSince(app.dateApplied)}d ago`;
                          } else if (app.status === "OA/Screening") {
                            wrapperClass += " bg-white border-blue-200 border-t-4 border-t-blue-500";
                            topBadgeText = `Take-home • ${getDaysSince(app.dateApplied) === 0 ? "Today" : `${getDaysSince(app.dateApplied)}d ago`}`;
                            topBadgeClass = "text-xs font-medium text-blue-500";
                          } else if (app.status === "Interview") {
                            wrapperClass += " bg-white border-purple-200 border-t-4 border-t-purple-500";
                            topBadgeText = `Final Loop • ${getDaysSince(app.dateApplied)}d ago`;
                            topBadgeClass = "text-xs font-medium text-purple-500";
                          } else if (app.status === "Offer") {
                            wrapperClass += " bg-white border-green-200 border-t-4 border-t-green-500 ring-2 ring-green-100";
                            topBadgeText = "Decision • Pending";
                            topBadgeClass = "text-xs font-medium text-green-600";
                          } else if (app.status === "Selected") {
                            wrapperClass += " bg-gradient-to-br from-white to-cyan-50/20 border-cyan-200 border-t-4 border-t-cyan-500 ring-2 ring-cyan-100/60 shadow-xs";
                            topBadgeText = "🎉 Selected!";
                            topBadgeClass = "text-xs font-bold text-cyan-600 animate-pulse";
                          } else if (app.status === "Rejected") {
                            wrapperClass += " bg-slate-100 border-slate-200 opacity-60";
                            topBadgeText = `${app.source === "Other" && app.customSource ? app.customSource : app.source} • Closed`;
                            topBadgeClass = "text-xs font-medium text-slate-400";
                          }

                          return (
                            <motion.div
                              layout
                              key={app.id}
                              id={`card-${app.id}`}
                              className={wrapperClass}
                            >
                              {/* Card Content */}
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <span className={topBadgeClass}>{topBadgeText}</span>
                                  {hasDeadlineAlert && app.status !== "Rejected" && app.status !== "Offer" && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase tracking-tighter">
                                      Deadline Soon
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-start justify-between gap-1">
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-[15px] leading-tight break-words">
                                      {app.company}
                                    </h4>
                                    <p className="text-sm text-slate-500 mt-0.5 break-words">
                                      {app.role}
                                    </p>
                                  </div>

                                  {/* Quick Action Icons */}
                                  <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => openEditApplicationModal(app)}
                                      className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                      title="Edit job"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteApplication(app.id)}
                                      className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-rose-600 transition-colors"
                                      title="Delete job"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Metadata details row */}
                                <div className="mt-3 flex flex-col gap-1.5 text-[11px] text-slate-500">
                                  {app.location && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                      <span className="truncate">{app.location}</span>
                                    </div>
                                  )}
                                  {app.salaryRange && app.status !== "Offer" && (
                                    <div className="flex items-center gap-1.5">
                                      <IndianRupee className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                      <span className="truncate font-mono">{app.salaryRange}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Offer salary badges */}
                                {app.status === "Offer" && app.salaryRange && (
                                  <div className="mt-3 flex flex-wrap gap-1">
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded">
                                      {app.salaryRange} Base
                                    </span>
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded">
                                      RSUs / Perks
                                    </span>
                                  </div>
                                )}

                                {/* OA screening deadline box */}
                                {app.status === "OA/Screening" && app.deadline && (
                                  <div className="mt-3 bg-blue-50 p-2 rounded text-[10px] text-blue-700 font-medium">
                                    Due: {app.deadline}
                                  </div>
                                )}

                                {/* Notes excerpt if present */}
                                {app.notes && (
                                  <p className="mt-3 line-clamp-2 rounded bg-slate-50 p-2 text-[11px] leading-normal text-slate-500">
                                    {app.notes}
                                  </p>
                                )}
                              </div>

                              {/* Alert Flags / Status dropdown row */}
                              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                                {/* Dynamic Alerts Indicators */}
                                <div className="flex flex-wrap gap-1.5">
                                  {/* Needs Follow-Up status flag */}
                                  {hasNeedsFollowUp && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-100">
                                      <Clock className="h-3 w-3 flex-shrink-0" />
                                      <span>Needs Follow-up</span>
                                    </span>
                                  )}

                                  {/* Clickable Resume Guide & ATS Score badge */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAtsAppId(app.id);
                                      setViewMode("ats");
                                      window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className="inline-flex items-center gap-1 rounded bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100 cursor-pointer transition-all shadow-2xs"
                                    title="Optimize this resume with ATS Suite"
                                  >
                                    <Sparkles className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                                    <span>
                                      {(() => {
                                        const score = calculateAtsScoreForApp(app, atsResumeText);
                                        return score !== null ? `ATS Match: ${score}%` : "ATS Suite";
                                      })()}
                                    </span>
                                  </button>

                                  {/* Link if URL present */}
                                  {app.url && (
                                    <a
                                      href={app.url}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100"
                                    >
                                      <span>Job Link</span>
                                      <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  )}
                                </div>

                                {/* Rapid Switch Dropdown */}
                                <div className="relative mt-1">
                                  <select
                                    value={app.status}
                                    onChange={(e) => handleStatusChange(app.id, e.target.value as JobStatus)}
                                    className="w-full bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                                  >
                                    {COLUMNS.map((col) => (
                                      <option key={col.status} value={col.status}>
                                        Move: {col.title}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : viewMode === "table" ? (
            <motion.div
              key="table-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
              id="table-view-container"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left" id="table-view">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Company & Role</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Salary Info</th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort("dateApplied")}>
                        <div className="flex items-center gap-1.5">
                          <span>Date Applied</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort("deadline")}>
                        <div className="flex items-center gap-1.5">
                          <span>Deadline</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </th>
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort("status")}>
                        <div className="flex items-center gap-1.5">
                          <span>Status</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {sortedAndFilteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                          <Briefcase className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="text-sm font-medium">No job applications match the filters.</p>
                        </td>
                      </tr>
                    ) : (
                      sortedAndFilteredApplications.map((app) => {
                        const hasDeadlineAlert = isDeadlineClose(app);
                        const hasNeedsFollowUp = needsFollowUp(app);
                        const columnInfo = COLUMNS.find((col) => col.status === app.status);

                        return (
                          <tr key={app.id} id={`row-${app.id}`} className="hover:bg-slate-50/50 transition-colors group">
                            {/* Company & Role */}
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  {app.company}
                                  {app.url && (
                                    <a
                                      href={app.url}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      className="text-slate-400 hover:text-slate-900"
                                      title="Open posting"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                </span>
                                <span className="text-xs text-slate-500 mt-0.5">{app.role}</span>
                                <div className="mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAtsAppId(app.id);
                                      setViewMode("ats");
                                      window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className="inline-flex items-center gap-1 rounded bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100 transition-colors cursor-pointer shadow-2xs"
                                    title="Open in Resume & ATS Suite"
                                  >
                                    <Sparkles className="h-2.5 w-2.5 text-indigo-500" />
                                    <span>
                                      {(() => {
                                        const score = calculateAtsScoreForApp(app, atsResumeText);
                                        return score !== null ? `ATS Match: ${score}%` : "ATS Suite";
                                      })()}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Location */}
                            <td className="px-6 py-4">
                              <span className="text-slate-600">{app.location || "—"}</span>
                            </td>

                            {/* Salary Info */}
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs text-slate-600">{app.salaryRange || "—"}</span>
                            </td>

                            {/* Date Applied */}
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-slate-700">{app.dateApplied}</span>
                                <span className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase font-mono">
                                  {getDaysSince(app.dateApplied)}d ago
                                </span>
                              </div>
                            </td>

                            {/* Deadline */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <span className={hasDeadlineAlert ? "text-rose-600 font-semibold" : "text-slate-700"}>
                                  {app.deadline || "—"}
                                </span>
                                {hasDeadlineAlert && (
                                  <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 uppercase tracking-wider animate-pulse border border-rose-100">
                                    Urgent
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Source */}
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                {app.source === "Other" && app.customSource ? app.customSource : app.source}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <select
                                  value={app.status}
                                  onChange={(e) => handleStatusChange(app.id, e.target.value as JobStatus)}
                                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none cursor-pointer ${columnInfo?.lightBg || "bg-slate-50"
                                    } ${columnInfo?.text || "text-slate-700"} ${columnInfo?.border || "border-slate-200"}`}
                                >
                                  {COLUMNS.map((col) => (
                                    <option key={col.status} value={col.status}>
                                      {col.title}
                                    </option>
                                  ))}
                                </select>
                                {hasNeedsFollowUp && (
                                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100">
                                    <Clock className="h-3 w-3" />
                                    <span>Stale</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditApplicationModal(app)}
                                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                  title="Edit application"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteApplication(app.id)}
                                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  title="Delete application"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : viewMode === "profile" ? (
            <motion.div
              key="profile-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 animate-in fade-in duration-200"
              id="profile-view"
            >
              {/* Header profile banner */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-sm overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 relative opacity-90" />
                <div className="px-6 pb-6 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-5 -mt-12">
                  <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg border-4 border-white dark:border-slate-900 select-none">
                      {userProfile.name ? userProfile.name[0].toUpperCase() : "U"}
                    </div>
                    <div className="text-center md:text-left space-y-1 text-slate-800 dark:text-slate-100">
                      <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{userProfile.name}</h2>
                        <span className="inline-flex self-center md:self-auto rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wide">
                          Verified Profile
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{userProfile.title}</p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-450 dark:text-slate-500 mt-2 font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{userProfile.location}</span>
                        </div>
                        <div className="h-1 w-1 bg-slate-300 dark:bg-slate-750 rounded-full hidden sm:block" />
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span>{userProfile.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProfileEditOpen(true)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer transform active:scale-95 shrink-0"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile Details</span>
                  </button>
                </div>
              </div>

              {/* Bento Grid layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1: Contact & Bio */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <User className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        Bio & Contact
                      </h3>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                          Location
                        </span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.location}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                          Email Address
                        </span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.email}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                          Professional Bio
                        </span>
                        <p className="text-slate-600 dark:text-slate-350 leading-relaxed italic bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/30 dark:border-slate-800/50 mt-1">
                          "{userProfile.bio || "No professional bio provided yet."}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Professional Details */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Briefcase className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        Target Role & Skills
                      </h3>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                          Headline / Title
                        </span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{userProfile.title}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
                          Target Role
                        </span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{userProfile.targetRole}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                          Key Skills
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(userProfile.skills || "").split(",").filter(Boolean).map((s: string, idx: number) => (
                            <span
                              key={idx}
                              className="bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-200/50 dark:border-slate-800/60"
                            >
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Integrations & Personalization */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <Sparkles className="h-4.5 w-4.5 text-fuchsia-600 dark:text-fuchsia-400" />
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        Smart Personalization
                      </h3>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {userProfile.linkedinUrl && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                            LinkedIn Profile
                          </span>
                          <a
                            href={userProfile.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            <span>View LinkedIn Profile</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 p-4 rounded-2xl space-y-2">
                        <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          LinkedIn Personalization Active
                        </h4>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-400 leading-relaxed">
                          Whenever you generate a LinkedIn Outreach template under the **Resume &amp; ATS Suite**, the application will dynamically replace placeholders with your full name: <strong className="font-bold text-indigo-900 dark:text-indigo-200">"{userProfile.name}"</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : viewMode === "resumes" ? (
            <motion.div
              key="resumes-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 text-slate-800 dark:text-slate-100 animate-in fade-in duration-200"
              id="resumes-view"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Header section with Plus popup trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FolderGit className="h-5 w-5 text-indigo-500" />
                      Resume Storage Vault
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Upload your latest resumes. Select which resume is currently active to use during ATS scans. There is no limit to adding resumes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUploadingResume(true)}
                    className="sm:self-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs shrink-0"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Upload Resume</span>
                  </button>
                </div>

                {/* Resumes List down */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Stored Documents ({resumes.length})
                  </h4>

                  {resumes.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                      <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
                      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Resumes Found</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Your storage vault is empty. Click "Upload Resume" to add professional resumes to your profile.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {resumes.map((resume) => {
                        const isSel = resume.isSelected;
                        return (
                          <div
                            key={resume.id}
                            className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border transition-all ${isSel
                              ? "border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/10"
                              : "border-slate-200 dark:border-slate-700"
                              }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5">
                                <div className={`p-3 rounded-xl ${isSel
                                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                                  : "bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                                  }`}>
                                  <FileText className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                                    {resume.name}
                                  </h4>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                    <span className="font-mono">{resume.fileSize}</span>
                                    <span>•</span>
                                    <span>Uploaded: {resume.uploadedAt}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {isSel ? (
                                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    Active for ATS
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResumes(prev =>
                                        prev.map(r => ({ ...r, isSelected: r.id === resume.id }))
                                      );
                                    }}
                                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-800 dark:hover:text-indigo-400 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                                  >
                                    Activate
                                  </button>
                                )}

                                {resumeIdToDelete === resume.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Confirm?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const filtered = resumes.filter(r => r.id !== resume.id);
                                        if (isSel && filtered.length > 0) {
                                          filtered[0].isSelected = true;
                                        }
                                        setResumes(filtered);
                                        setResumeIdToDelete(null);
                                        setNotifications(prev => [
                                          {
                                            id: `notif-${Date.now()}`,
                                            title: "Resume Deleted",
                                            message: `"${resume.name}" has been removed from storage.`,
                                            time: "Just now",
                                            isRead: false,
                                            type: "info"
                                          },
                                          ...prev
                                        ]);
                                      }}
                                      className="px-2.5 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer transition-colors"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setResumeIdToDelete(null)}
                                      className="px-2 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setResumeIdToDelete(resume.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700/60 rounded-lg cursor-pointer transition-colors"
                                    title="Delete resume"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Collapsible Content Preview */}
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                              <details className="group">
                                <summary className="text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer list-none flex items-center gap-1 select-none">
                                  <ChevronRight className="h-3.5 w-3.5 transform transition-transform group-open:rotate-90" />
                                  <span>View Extracted Text Preview</span>
                                </summary>
                                <div className="mt-2.5">
                                  <pre className="p-4 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-mono max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-800">
                                    {resume.content || "Empty content detected."}
                                  </pre>
                                </div>
                              </details>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Popup modal for resume upload */}
              <AnimatePresence>
                {isUploadingResume && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
                    <div
                      className="absolute inset-0 cursor-default"
                      onClick={() => setIsUploadingResume(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl p-6 flex flex-col gap-5 z-10 max-h-[90vh]"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 shrink-0">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Upload className="h-4.5 w-4.5 text-indigo-500" />
                          Resume Storage Vault
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsUploadingResume(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg cursor-pointer"
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Select a document file in <strong>.txt, .pdf, or .docx</strong> format. The system will automatically extract plain text content for ATS checks.
                        </p>

                        <div id="drag-drop-container-vault" className="shrink-0">
                          <label
                            htmlFor="vault-resume-upload-input"
                            className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/5 dark:bg-slate-900/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-3xs"
                          >
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
                              <Upload className="h-5 w-5" />
                            </div>
                            <div className="text-center">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                Click to upload or drag &amp; drop
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-0.5">
                                Supports TXT, PDF, or Word DOCX formats
                              </span>
                            </div>
                            <input
                              type="file"
                              id="vault-resume-upload-input"
                              accept=".txt,.pdf,.docx"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const txt = event.target?.result;
                                  if (typeof txt === "string") {
                                    const cleaned = file.name.endsWith(".txt")
                                      ? txt
                                      : txt.replace(/[^\x20-\x7E\s]/g, " ").replace(/\s+/g, " ");

                                    const newResume = {
                                      id: `resume-${Date.now()}`,
                                      name: file.name,
                                      fileSize: sizeStr,
                                      fileType: file.name.split('.').pop() || 'txt',
                                      uploadedAt: new Date().toISOString().split("T")[0],
                                      isSelected: true,
                                      content: cleaned
                                    };

                                    setResumes(prev => {
                                      const deactivated = prev.map(r => ({ ...r, isSelected: false }));
                                      return [newResume, ...deactivated];
                                    });

                                    setNotifications(prev => [
                                      {
                                        id: `notif-${Date.now()}`,
                                        title: "Resume Sync Completed",
                                        message: `"${file.name}" uploaded & activated in ATS Suite successfully.`,
                                        time: "Just now",
                                        isRead: false,
                                        type: "success"
                                      },
                                      ...prev
                                    ]);
                                  }
                                };
                                reader.readAsText(file);
                              }}
                            />
                          </label>
                        </div>

                        {/* List of resumes right inside the plus popup */}
                        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Your Stored Resumes ({resumes.length})
                          </h4>

                          {resumes.length === 0 ? (
                            <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-xs italic">
                              No resumes uploaded yet. Drag &amp; drop a file above to add!
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                              {resumes.map((resume) => {
                                const isSel = resume.isSelected;
                                return (
                                  <div
                                    key={resume.id}
                                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${isSel
                                      ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500 ring-1 ring-indigo-500/20"
                                      : "bg-slate-50/45 dark:bg-slate-900/30 border-slate-100 dark:border-slate-700/60 hover:border-slate-200 dark:hover:border-slate-650"
                                      }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <FileText className={`h-4 w-4 shrink-0 ${isSel ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-800 dark:text-slate-250 truncate" title={resume.name}>
                                          {resume.name}
                                        </p>
                                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                                          {resume.fileSize} • Uploaded {resume.uploadedAt}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isSel ? (
                                        <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
                                          <Check className="h-2.5 w-2.5" />
                                          Active
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setResumes(prev =>
                                              prev.map(r => ({ ...r, isSelected: r.id === resume.id }))
                                            );
                                          }}
                                          className="px-2.5 py-0.5 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-800 dark:hover:text-indigo-400 rounded-lg text-[10px] font-bold cursor-pointer transition-all bg-white dark:bg-slate-800"
                                        >
                                          Activate
                                        </button>
                                      )}

                                      {resumeIdToDelete === resume.id ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Confirm?</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const filtered = resumes.filter(r => r.id !== resume.id);
                                              if (isSel && filtered.length > 0) {
                                                filtered[0].isSelected = true;
                                              }
                                              setResumes(filtered);
                                              setResumeIdToDelete(null);
                                              setNotifications(prev => [
                                                {
                                                  id: `notif-${Date.now()}`,
                                                  title: "Resume Deleted",
                                                  message: `"${resume.name}" has been removed from storage.`,
                                                  time: "Just now",
                                                  isRead: false,
                                                  type: "info"
                                                },
                                                ...prev
                                              ]);
                                            }}
                                            className="px-2 py-0.5 text-[9px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer transition-colors"
                                          >
                                            Delete
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setResumeIdToDelete(null)}
                                            className="px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setResumeIdToDelete(resume.id)}
                                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700/60 rounded-lg cursor-pointer transition-colors"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end border-t border-slate-100 dark:border-slate-700 pt-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsUploadingResume(false)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : viewMode === "notes" ? (
            <motion.div
              key="notes-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8 text-slate-800 dark:text-slate-100 animate-in fade-in duration-200"
              id="notes-view"
            >
              <CareerNotesView
                userNotes={userNotes}
                setUserNotes={setUserNotes}
                setNotifications={setNotifications}
              />
            </motion.div>
          ) : (
            <motion.div
              key="ats-optimizer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
              id="ats-view"
            >
              {/* Section Grid: ATS Resume File Uploader & Job Description Keyword Matcher */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="ats-core-suite-container">
                {/* Left Side: Inputs & File Uploads */}
                <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight mb-2">
                      ATS Compatibility Checker
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Upload your resume file and paste a target job description. Our AI will extract the key term requirements from the description and score your resume's keyword overlap to provide instant optimization recommendations.
                    </p>
                  </div>

                  {/* Optional Target Company Preference */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Target Company Preference (Optional)</span>
                      </label>
                      {prefCompanyName && (
                        <button
                          type="button"
                          onClick={() => setPrefCompanyName("")}
                          className="text-[10px] font-semibold text-rose-600 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Enter the name of your target company. If provided, all tools (resume scans, optimized bullets, interview questions, outreach drafts) will tailor specifically to this company.
                    </p>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={prefCompanyName}
                        onChange={(e) => setPrefCompanyName(e.target.value)}
                        placeholder="e.g. Google, Stripe, Vercel"
                        className="w-full text-xs bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 px-3.5 py-2 pl-9 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Briefcase className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>

                  {isAnalyzingResume && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50/75 border border-indigo-100 p-3 rounded-xl animate-pulse">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                      <span>Gemini is conducting deep keyword extraction & structural matching...</span>
                    </div>
                  )}

                  {/* Resume File Upload Widget */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Upload Resume File (.txt, .pdf, .docx)
                    </label>

                    {uploadedFileName ? (
                      <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 flex flex-col gap-3 shadow-3xs">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 text-indigo-700 p-2 rounded-xl">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                                {uploadedFileName}
                              </p>
                              <span className="text-[10px] font-semibold text-slate-400 block font-mono">
                                Size: {uploadedFileSize}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              Uploaded
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedFileName("");
                                setUploadedFileSize("");
                                setAtsResumeText("");
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Remove file"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible extracted text preview */}
                        <div className="border-t border-slate-200/50 pt-2.5">
                          <button
                            type="button"
                            onClick={() => setShowResumePreview(!showResumePreview)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                          >
                            <span>{showResumePreview ? "Hide" : "Show"} Extracted Resume Text ({atsResumeText.split(/\s+/).length} words)</span>
                            <ChevronDown className={`h-3 w-3 transform transition-transform ${showResumePreview ? "rotate-180" : ""}`} />
                          </button>

                          {showResumePreview && (
                            <textarea
                              value={atsResumeText}
                              onChange={(e) => setAtsResumeText(e.target.value)}
                              rows={5}
                              className="w-full mt-2 rounded-xl border border-slate-200 bg-white p-3 text-[10px] font-mono text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300 leading-normal"
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div id="drag-drop-container">
                        <label
                          htmlFor="ats-resume-upload-input"
                          className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 shadow-3xs"
                        >
                          <Upload className="h-6 w-6 text-indigo-500 animate-bounce" />
                          <div className="text-center">
                            <span className="text-xs font-bold text-slate-700 block">
                              Click to upload or drag &amp; drop
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Supports raw PDF, Word, or TXT formats
                            </span>
                          </div>
                          <input
                            type="file"
                            id="ats-resume-upload-input"
                            accept=".txt,.pdf,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadedFileName(file.name);
                              setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const txt = event.target?.result;
                                if (typeof txt === "string") {
                                  // Strip binary characters if uploaded .pdf or .docx directly
                                  const cleaned = file.name.endsWith(".txt")
                                    ? txt
                                    : txt.replace(/[^\x20-\x7E\s]/g, " ").replace(/\s+/g, " ");
                                  setAtsResumeText(cleaned);
                                }
                              };
                              reader.readAsText(file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Paste Job Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Paste Job Description
                      </label>
                      {atsJobDescriptionText && (
                        <button
                          type="button"
                          onClick={() => setAtsJobDescriptionText("")}
                          className="text-[10px] font-semibold text-rose-600 hover:underline cursor-pointer"
                        >
                          Clear Description
                        </button>
                      )}
                    </div>
                    <textarea
                      value={atsJobDescriptionText}
                      onChange={(e) => setAtsJobDescriptionText(e.target.value)}
                      onPaste={(e) => {
                        const pastedText = e.clipboardData.getData('Text');
                        if (pastedText && pastedText.trim().length > 50 && atsResumeText.trim()) {
                          // Automatically run ATS analysis on paste if we have a resume
                          setTimeout(() => {
                            handleRunAtsAnalysis(pastedText);
                          }, 100);
                        }
                      }}
                      placeholder="Paste the target job description details here..."
                      rows={8}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Trigger Analysis Button */}
                  <button
                    type="button"
                    disabled={isAnalyzingResume}
                    onClick={() => handleRunAtsAnalysis()}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:bg-slate-100 disabled:text-slate-400 transition-all transform active:scale-98"
                  >
                    {isAnalyzingResume ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Running Deep Keyword Extraction &amp; ATS Score...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span>Run ATS Match &amp; Keyword Analyzer</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right Side: ATS Evaluation & Score Report */}
                <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight mb-0.5">
                          ATS Score Alignment Report
                        </h3>
                        <span className="text-[10px] text-indigo-600 uppercase font-mono tracking-wider font-extrabold block">
                          Real-Time Keyword &amp; Match Analysis
                        </span>
                      </div>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                        Dynamic Checking
                      </span>
                    </div>

                    {/* Compatibility Score Circular Gauge */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="md:col-span-5 flex flex-col items-center justify-center">
                        <div className="relative flex items-center justify-center">
                          <svg className="w-28 h-28">
                            <circle
                              className="text-slate-200"
                              strokeWidth="7"
                              stroke="currentColor"
                              fill="transparent"
                              r="46"
                              cx="56"
                              cy="56"
                            />
                            <circle
                              className={`transition-all duration-500 ${realTimeAtsAnalysis.score >= 75
                                ? "text-emerald-500"
                                : realTimeAtsAnalysis.score >= 50
                                  ? "text-amber-500"
                                  : "text-rose-500"
                                }`}
                              strokeWidth="7"
                              strokeDasharray={289}
                              strokeDashoffset={289 - (289 * realTimeAtsAnalysis.score) / 100}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="46"
                              cx="56"
                              cy="56"
                              transform="rotate(-90 56 56)"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-2xl font-black font-mono text-slate-800">{realTimeAtsAnalysis.score}%</span>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Match</span>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-7 space-y-2 text-left">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${realTimeAtsAnalysis.score >= 75
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : realTimeAtsAnalysis.score >= 50
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                          {realTimeAtsAnalysis.score >= 75
                            ? "Recruiter Grade - Strong Overlap"
                            : realTimeAtsAnalysis.score >= 50
                              ? "Medium Overlap - Tailor further"
                              : "Low Compatibility - Missing critical tech"}
                        </span>
                        <p className="text-xs text-slate-500 leading-normal font-sans">
                          {realTimeAtsAnalysis.score >= 75
                            ? "Excellent fit! Your resume matches a significant portion of the skills found in the job description."
                            : "Consider editing your bullet achievements to explicitly reference missing keywords listed below to boost your real-time score."}
                        </p>
                      </div>
                    </div>

                    {/* Extracted Term Mapping */}
                    <div className="space-y-4">
                      {/* Matched Panel */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                            Matched Keywords ({realTimeAtsAnalysis.matched.length})
                          </span>
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                          {realTimeAtsAnalysis.matched.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic p-1">No matched terms detected yet. Paste a job and hit Run!</span>
                          ) : (
                            realTimeAtsAnalysis.matched.map((kw, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 font-sans"
                              >
                                <Check className="h-3 w-3" />
                                {kw}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Missing Panel */}
                      {atsResumeText.trim() && atsJobDescriptionText.trim() && (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                Missing Tech &amp; Requirements ({realTimeAtsAnalysis.missing.length})
                              </span>
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                              {realTimeAtsAnalysis.missing.length === 0 ? (
                                <span className="text-[11px] text-slate-400 italic p-1">All primary keywords matched! Excellent!</span>
                              ) : (
                                realTimeAtsAnalysis.missing.map((kw, idx) => {
                                  const isSelected = selectedMissingKeyword === kw || (!selectedMissingKeyword && idx === 0);
                                  return (
                                    <span
                                      key={idx}
                                      onClick={() => setSelectedMissingKeyword(kw)}
                                      title="Click to view tailoring tip & suggestions"
                                      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all duration-150 font-sans ${isSelected
                                        ? "bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-200/50 scale-102"
                                        : "bg-amber-50 border border-amber-100 text-amber-800 hover:bg-amber-100"
                                        }`}
                                    >
                                      + {kw}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* Help the user make a change (Interactive Helper Box) */}
                          {realTimeAtsAnalysis.missing.length > 0 && (
                            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 text-left">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-indigo-500" />
                                <span className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider">
                                  Interactive Tailoring Helper: {selectedMissingKeyword || realTimeAtsAnalysis.missing[0]}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-normal">
                                Click one of these suggestions to append it to your resume and watch your score increase in real-time!
                              </p>
                              <div className="space-y-1.5 pt-1">
                                {[
                                  `Designed and implemented high-performance integrations using ${selectedMissingKeyword || realTimeAtsAnalysis.missing[0]} to optimize system workflows.`,
                                  `Collaborated with key stakeholders to align technical architecture with standard ${selectedMissingKeyword || realTimeAtsAnalysis.missing[0]} best practices.`
                                ].map((suggestion, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                      setAtsResumeText(prev => prev + `\n- ${suggestion}`);
                                      setModalAlert({
                                        title: "Accomplishment Appended!",
                                        message: `Appended suggestion containing "${selectedMissingKeyword || realTimeAtsAnalysis.missing[0]}" to your resume draft. Your score will update instantly!`,
                                        type: "success"
                                      });
                                    }}
                                    className="w-full text-left bg-white hover:bg-indigo-50 p-2 rounded-lg border border-slate-200/80 hover:border-indigo-300 text-xs font-medium text-slate-700 leading-relaxed cursor-pointer transition-all duration-150 flex items-start gap-1.5"
                                  >
                                    <span className="text-indigo-500 font-bold shrink-0 mt-0.5">+</span>
                                    <span>{suggestion}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tailoring Recommendations Bullet List */}
                  {atsResumeText.trim() && atsJobDescriptionText.trim() && (
                    <div className="border-t border-slate-100 pt-4 mt-2 space-y-2 text-left">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                          Actionable Tailoring Recommendations
                        </span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-600 pl-0 leading-relaxed list-none">
                        {realTimeAtsAnalysis.atsSuggestions?.slice(0, 3).map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                            <span className="font-medium text-slate-700">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Related Tailoring & Preparation Tools */}
              <div className="border-t border-slate-200/60 pt-8 space-y-6">
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-lg tracking-tight mb-1">
                    Job Preparation &amp; Bullet Optimization Suite
                  </h3>
                  <p className="text-xs text-slate-500">
                    Leverage your target job keywords to draft outreach communications, prepare behavioral questions, and refine resume accomplishment bullets.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Tool A: Resume Bullet Point Enhancer */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">A</span>
                        <h4 className="font-bold text-slate-800 text-sm">Resume Bullet Point Enhancer</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Convert low-impact, passive responsibilities into metrics-driven accomplishments. Paste an existing resume bullet point to rewrite.
                      </p>
                      <input
                        type="text"
                        value={bulletToOptimize}
                        onChange={(e) => setBulletToOptimize(e.target.value)}
                        placeholder="e.g., Responsible for writing software features."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-medium"
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const suggested = getSuggestedWeakBullet(atsJobDescriptionText);
                            setBulletToOptimize(suggested);
                            setModalAlert({
                              title: "Bullet Loaded",
                              message: "Loaded a tailored weak bullet point based on the current Job Description.",
                              type: "success"
                            });
                          }}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          ✨ Suggest tailored weak bullet point based on Job
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 space-y-3">
                      <button
                        type="button"
                        disabled={isOptimizingBullet || !bulletToOptimize.trim()}
                        onClick={handleOptimizeBullet}
                        className="w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold py-2 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer flex items-center justify-center gap-1 transition-all"
                      >
                        {isOptimizingBullet ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Optimizing Bullet...</span>
                          </>
                        ) : (
                          <span>Optimize Achievement Bullet</span>
                        )}
                      </button>

                      {optimizedBulletResult && (
                        <div className="space-y-3 pt-2">
                          <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl text-xs text-slate-800 leading-relaxed relative">
                            <span className="block text-[9px] uppercase tracking-wider font-extrabold text-emerald-700 font-sans mb-1">✓ Recommended Core Bullet</span>
                            <p className="font-medium">{optimizedBulletResult}</p>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(optimizedBulletResult);
                                setModalAlert({ title: "Bullet Copied!", message: "Copied the optimized bullet to your clipboard.", type: "success" });
                              }}
                              className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-indigo-600 font-bold hover:underline"
                            >
                              Copy Core Bullet
                            </button>
                          </div>

                          {optimizedBulletOptions.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              <span className="block text-[9px] uppercase tracking-wider font-bold text-indigo-700 font-sans">Three Distinct Professional Options:</span>
                              {optimizedBulletOptions.map((opt, i) => (
                                <div key={i} className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs text-slate-700 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[9px] uppercase text-indigo-600 tracking-wider">Option {i + 1}: {opt.type}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(opt.bullet);
                                        setModalAlert({ title: "Option Copied!", message: `Copied ${opt.type} option to your clipboard.`, type: "success" });
                                      }}
                                      className="text-[9px] text-slate-500 hover:text-indigo-600 font-bold"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <p className="font-medium leading-relaxed font-sans">{opt.bullet}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tool B: Behavioral Interview Prep */}
                  {atsResumeText.trim() && atsJobDescriptionText.trim() && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">B</span>
                          <h4 className="font-bold text-slate-800 text-sm">Technical &amp; Behavioral Interview Prep</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Analyze target keywords for this role and generate realistic interview questions technical teams will ask you.
                        </p>
                      </div>

                      <div className="pt-2 space-y-3">
                        <button
                          type="button"
                          disabled={isGeneratingPrep}
                          onClick={handleGeneratePrep}
                          className="w-full rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 text-xs font-bold py-2 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                        >
                          {isGeneratingPrep ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Formulating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 text-indigo-500" />
                              <span>Generate 3 Interview Questions</span>
                            </>
                          )}
                        </button>

                        {prepQuestions.length > 0 && (
                          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                            {prepQuestions.map((item, idx) => {
                              const qText = typeof item === 'string' ? item : item.question;
                              const rText = typeof item === 'string' ? '' : item.response;
                              const isExpanded = !!expandedPrepIdx[idx];

                              return (
                                <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-[11px] text-slate-700 leading-relaxed flex flex-col gap-2 shadow-3xs">
                                  <div>
                                    <span className="font-bold text-slate-900 block font-sans mb-0.5">Question {idx + 1}</span>
                                    <p className="font-medium text-slate-800">{qText}</p>
                                  </div>

                                  {rText && (
                                    <div>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedPrepIdx(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer shadow-3xs flex items-center gap-1 ${isExpanded
                                          ? "bg-indigo-600 text-white border-indigo-600"
                                          : "bg-white text-indigo-700 border-indigo-100 hover:bg-indigo-50"
                                          }`}
                                      >
                                        {isExpanded ? "Hide Solution" : "✓ View Best Answer"}
                                      </button>
                                    </div>
                                  )}

                                  {isExpanded && rText && (
                                    <div className="bg-white border border-indigo-100 shadow-sm rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200">
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-indigo-600 font-sans">
                                          <Sparkles className="h-3 w-3 animate-pulse text-indigo-500" />
                                          <span>Highly Impressive STAR Response</span>
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(rText);
                                            setModalAlert({ title: "Answer Copied!", message: "The professional interview response was copied to clipboard.", type: "success" });
                                          }}
                                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-100/60 cursor-pointer shadow-3xs"
                                        >
                                          <Clipboard className="h-3.5 w-3.5 text-indigo-600" />
                                          <span>Copy Response</span>
                                        </button>
                                      </div>

                                      <div className="text-[11px] text-slate-700 font-sans leading-relaxed whitespace-pre-line font-medium pr-1 max-h-48 overflow-y-auto">
                                        {rText}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tool C: Cold Outreach Message Draft */}
                  {atsResumeText.trim() && atsJobDescriptionText.trim() && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">C</span>
                          <h4 className="font-bold text-slate-800 text-sm">LinkedIn Outreach &amp; Email Draft</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Automatically draft a short, warm outreach intro or cover letter paragraph focusing on the identified skills and company requirements.
                        </p>
                      </div>

                      <div className="pt-2 space-y-3">
                        <button
                          type="button"
                          disabled={isGeneratingOutreach}
                          onClick={handleGenerateOutreach}
                          className="w-full rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 text-xs font-bold py-2 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                        >
                          {isGeneratingOutreach ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Drafting message...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 text-indigo-500" />
                              <span>Draft Cold Outreach Message</span>
                            </>
                          )}
                        </button>

                        {outreachDraft && (
                          <div className="space-y-2">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-700 font-mono leading-relaxed max-h-40 overflow-y-auto relative whitespace-pre-line">
                              <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-500 font-sans mb-1.5">Outreach Message Draft</span>
                              {outreachDraft}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(outreachDraft);
                                setModalAlert({ title: "Copied!", message: "Outreach message draft copied to clipboard.", type: "success" });
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100/80 cursor-pointer shadow-3xs"
                            >
                              <Clipboard className="h-3.5 w-3.5" />
                              <span>Copy Outreach Message</span>
                            </button>

                            {/* Highlighted Outreach Motivation Line - fully selectable/copyable now */}
                            <div className="bg-amber-50/70 border border-amber-200/40 rounded-xl p-3 text-[11px] text-amber-900 mt-2.5 shadow-3xs">
                              <p className="leading-relaxed font-medium">
                                💡 <span className="font-semibold text-amber-800">Outreach Mindset Booster:</span> Connection breeds opportunity! Every single message you send is an active step closer to landing your dream role. Reach out with absolute confidence and pride in your professional journey — you have got this! 🚀✨
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 4: Resume & ATS Suite Guidelines (Moved to bottom of the page) */}
              <div className="border-t border-slate-200/60 pt-8" id="ats-bottom-guidelines">
                <div className="bg-gradient-to-r from-indigo-50/70 via-indigo-50/35 to-purple-50/70 rounded-2xl border border-indigo-100 p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b border-indigo-100/40 pb-3">
                    <div className="flex items-center gap-2 text-indigo-950 font-black text-sm uppercase tracking-wider">
                      <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                      <span>Resume &amp; ATS Suite Guidelines</span>
                    </div>
                    <div className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-100/60 shadow-xs flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active Optimization Module
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white rounded-xl p-4 border border-indigo-100/40 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 mt-0.5">1</span>
                      <div>
                        <strong className="block text-slate-900 font-bold mb-0.5">Sleek, Simple Structure</strong>
                        ATS parsers scan plain left-to-right text. Avoid tables, headers/footers, icons, graphics, or multi-column layouts which scramble text data.
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-indigo-100/40 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 mt-0.5">2</span>
                      <div>
                        <strong className="block text-slate-900 font-bold mb-0.5">Keyword Match Threshold</strong>
                        Aim for a minimum of 70% keyword alignment on technologies and tools. Select any job below to compute your overlap instantly.
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-indigo-100/40 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 mt-0.5">3</span>
                      <div>
                        <strong className="block text-slate-900 font-bold mb-0.5">Metrics-Driven Impact</strong>
                        Begin experience bullets with context-rich action verbs (e.g. Optimized, Developed, Managed). Quantify achievements with concrete numbers.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Elegant Highlighted Footer with Hemanth Kattamuri */}
      <footer className="mt-auto py-8 mb-20 border-t border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 shrink-0 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
            {/* User Highlighted Name with Verified badge */}
            <div className="flex items-center justify-center gap-2 bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/30 px-4 py-2.5 rounded-2xl shadow-3xs transition-all duration-300 hover:scale-102 hover:shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created By</span>
              <span className="text-sm font-black font-display flex items-center gap-1.5 bg-gradient-to-r from-indigo-700 to-violet-700 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                Hemanth Kattamuri
                <BadgeCheck className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 fill-indigo-100 dark:fill-indigo-950/60 shrink-0" title="Verified Creator" />
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.2)] safe-area-pb">
        <div className="flex items-center justify-around p-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              setViewMode("kanban");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all cursor-pointer ${viewMode === "kanban" ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-slate-500 hover:text-indigo-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"}`}
          >
            <Kanban className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] font-bold">Board</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("table");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all cursor-pointer ${viewMode === "table" ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-slate-500 hover:text-indigo-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"}`}
          >
            <TableIcon className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] font-bold">Table</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("resumes");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all cursor-pointer ${viewMode === "resumes" ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-slate-500 hover:text-indigo-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"}`}
          >
            <FileText className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] font-bold">Resumes</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("notes");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all cursor-pointer ${viewMode === "notes" ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-slate-500 hover:text-indigo-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"}`}
          >
            <Notebook className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] font-bold">Wishlist</span>
          </button>
        </div>
      </div>

      {/* MODAL 0: PASTE JOB DESCRIPTION */}
      <AnimatePresence>
        {isPasteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="modal-paste">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasteOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-700/50"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ClipboardPaste className="h-5 w-5 text-indigo-500" />
                  Paste Job Description
                </h3>
                <button
                  type="button"
                  onClick={() => setIsPasteOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste the target job description details here... We'll extract the Role, Company, Location, and Requirements automatically."
                  rows={8}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
                />
                
                {extractionError && (
                  <div className="mt-3 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 p-2 rounded-lg flex gap-1.5 items-center">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{extractionError}</span>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasteOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isExtracting}
                  onClick={() => handleGeminiExtract()}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Extracting Details...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Extract &amp; Create Application</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 1: ADD & EDIT APPLICATION FORM */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="modal-add-edit">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-slate-700" />
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    {isEditMode ? "Edit Job Application" : "New Job Application"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Form Content */}
              <form onSubmit={handleSaveApplication} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* 2-Column row 1: Company & Role */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google, Stripe"
                      value={formState.company}
                      onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                      className={`w-full rounded-xl border px-3.5 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all ${formErrors.company
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400"
                        : "border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                        }`}
                    />
                    {formErrors.company && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.company}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Job Title / Role <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Frontend Engineer"
                      value={formState.role}
                      onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                      className={`w-full rounded-xl border px-3.5 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all ${formErrors.role
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400"
                        : "border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                        }`}
                    />
                    {formErrors.role && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.role}</p>
                    )}
                  </div>
                </div>

                {/* 2-Column row 2: Location & Salary */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Location <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco (Hybrid), Remote"
                      value={formState.location}
                      onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Salary Range <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">₹</span>
                        <input
                          type="text"
                          placeholder="Min (e.g. 1000000)"
                          value={formState.minSalary || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setFormState({ ...formState, minSalary: val });
                          }}
                          className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all font-mono"
                        />
                      </div>
                      <span className="text-slate-400 font-bold px-1">—</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">₹</span>
                        <input
                          type="text"
                          placeholder="Max (e.g. 1500000)"
                          value={formState.maxSalary || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setFormState({ ...formState, maxSalary: val });
                          }}
                          className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2-Column row 3: Dates */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Date Applied
                    </label>
                    <input
                      type="date"
                      required
                      value={formState.dateApplied}
                      onChange={(e) => setFormState({ ...formState, dateApplied: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Deadline <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={formState.deadline}
                      onChange={(e) => setFormState({ ...formState, deadline: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                    />
                  </div>
                </div>

                {/* 2-Column row 4: Source & Status */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Application Source
                    </label>
                    <select
                      value={formState.source}
                      onChange={(e) => setFormState({ ...formState, source: e.target.value as JobSource })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 bg-white text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all cursor-pointer"
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Company Website">Company Website</option>
                      <option value="Referral">Referral</option>
                      <option value="Other">Other</option>
                    </select>
                    {formState.source === "Other" && (
                      <div className="mt-2">
                        <label className="block text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                          Specify Other Source <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Glassdoor, Twitter, Slack"
                          value={formState.customSource}
                          onChange={(e) => setFormState({ ...formState, customSource: e.target.value })}
                          className="w-full rounded-xl border border-indigo-200 px-3.5 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all bg-indigo-50/20"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Current Status
                    </label>
                    <select
                      value={formState.status}
                      onChange={(e) => setFormState({ ...formState, status: e.target.value as JobStatus })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 bg-white text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all cursor-pointer"
                    >
                      {COLUMNS.map((col) => (
                        <option key={col.status} value={col.status}>
                          {col.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Job Posting URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Job Posting URL <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://company.com/careers/job-id"
                    value={formState.url}
                    onChange={(e) => setFormState({ ...formState, url: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                  />
                </div>

                {/* Resume Keyword & ATS Suggestions */}
                {((formState.suggestedKeywords && formState.suggestedKeywords.length > 0) || (formState.atsSuggestions && formState.atsSuggestions.length > 0)) && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                      <Sparkles className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                      <span>Resume &amp; ATS Tailoring Guide</span>
                    </div>

                    {formState.suggestedKeywords && formState.suggestedKeywords.length > 0 && (
                      <div>
                        <span className="block text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2">
                          Key Resume Keywords to Include
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {formState.suggestedKeywords.map((kw, i) => (
                            <span key={i} className="inline-flex items-center rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-medium text-indigo-700">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {formState.atsSuggestions && formState.atsSuggestions.length > 0 && (
                      <div>
                        <span className="block text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2">
                          Actionable ATS Optimization Tips
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4 leading-relaxed">
                          {formState.atsSuggestions.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Notes &amp; Details <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Preparation thoughts, referral contacts, interviewed managers, follow-up ideas..."
                    value={formState.notes}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all resize-none"
                  />
                </div>

                {/* Actions bottom */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 hover:shadow-md transition-all active:scale-98 cursor-pointer"
                  >
                    {isEditMode ? "Save Changes" : "Save Application"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900">Delete Application?</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete this job application? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setApplications((prev) => prev.filter((app) => app.id !== deleteConfirmId));
                  setDeleteConfirmId(null);
                }}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-xs transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROFILE DETAILS */}
      <AnimatePresence>
        {isProfileEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="modal-edit-profile">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileEditOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Update Profile Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileEditOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Form Content */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const updated = {
                    name: (formData.get("profile-name") as string).trim(),
                    email: (formData.get("profile-email") as string).trim(),
                    title: (formData.get("profile-title") as string).trim(),
                    location: (formData.get("profile-location") as string).trim(),
                    targetRole: (formData.get("profile-target") as string).trim(),
                    skills: (formData.get("profile-skills") as string).trim(),
                    linkedinUrl: (formData.get("profile-linkedin") as string).trim(),
                    bio: (formData.get("profile-bio") as string).trim(),
                  };
                  if (!updated.name) {
                    setModalAlert({
                      title: "Name Required",
                      message: "Please enter your full name before saving.",
                      type: "error"
                    });
                    return;
                  }
                  setUserProfile(updated);
                  if (auth.currentUser && updated.name !== auth.currentUser.displayName) {
                    try {
                      await updateProfile(auth.currentUser, { displayName: updated.name });
                    } catch (err) {
                      console.error("Failed to sync display name:", err);
                    }
                  }
                  setIsProfileEditOpen(false);
                  setModalAlert({
                    title: "Profile Saved Successfully",
                    message: "Your profile details have been saved and will now be used across the workspace.",
                    type: "success"
                  });
                }}
                className="flex-1 overflow-y-auto p-6 space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="profile-name"
                      required
                      defaultValue={userProfile.name}
                      placeholder="Your full name"
                      className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="profile-email"
                      defaultValue={userProfile.email}
                      placeholder="you@example.com"
                      className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Headline / Professional Title
                    </label>
                    <input
                      type="text"
                      name="profile-title"
                      defaultValue={userProfile.title}
                      placeholder="e.g. Software Engineer"
                      className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Target Role
                    </label>
                    <input
                      type="text"
                      name="profile-target"
                      defaultValue={userProfile.targetRole}
                      placeholder="e.g. Full Stack Developer"
                      className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="profile-location"
                      defaultValue={userProfile.location}
                      placeholder="City, Country"
                      className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      name="profile-linkedin"
                      defaultValue={userProfile.linkedinUrl}
                      placeholder="https://linkedin.com/in/you"
                      className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Key Skills (comma-separated list)
                  </label>
                  <input
                    type="text"
                    name="profile-skills"
                    defaultValue={userProfile.skills}
                    placeholder="React, TypeScript, Node.js"
                    className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Professional Bio
                  </label>
                  <textarea
                    name="profile-bio"
                    rows={4}
                    defaultValue={userProfile.bio}
                    placeholder="A short professional summary"
                    className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-950/80 dark:focus:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium resize-none leading-relaxed"
                  />
                </div>

                {/* Actions bottom */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsProfileEditOpen(false)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-98 cursor-pointer flex items-center gap-1"
                  >
                    <BadgeCheck className="h-4 w-4" />
                    <span>Save Profile</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert Modal */}
      {modalAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className={`text-base font-bold ${modalAlert.type === "error" ? "text-rose-600" : "text-indigo-600"}`}>
              {modalAlert.title}
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {modalAlert.message}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModalAlert(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-xs transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface LoginScreenProps {
  onLoginSuccess: (profile?: any) => void;
}

function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emptyProfile = {
    name: "",
    email: "",
    title: "",
    location: "",
    targetRole: "",
    skills: "",
    linkedinUrl: "",
    bio: ""
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && (!name || !title))) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      const finalProfile = {
        ...emptyProfile,
        name: isSignUp ? name : (auth.currentUser?.displayName || ""),
        email: email,
        title: isSignUp ? title : "",
      };
      onLoginSuccess(finalProfile);
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const finalProfile = {
        ...emptyProfile,
        name: user.displayName || "",
        email: user.email || "",
      };
      onLoginSuccess(finalProfile);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === "auth/unauthorized-domain") {
        setError(
          `This domain is not authorized in Firebase. Add "${window.location.hostname}" under Authentication → Settings → Authorized domains in the placofy-e4bc3 project.`
        );
      } else if (code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else if (code === "auth/popup-blocked") {
        setError("Pop-up was blocked. Allow pop-ups for this site and try again.");
      } else {
        setError(err?.message || "Google Sign-In failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl overflow-hidden shadow-md shadow-indigo-100 mb-4 bg-white border border-slate-200">
            <img src="/icon-192.png" alt="Placofy" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 font-display">
            {isSignUp ? "Create your account" : "Sign in to Placofy"}
          </h2>
          <p className="mt-2 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Manage your job applications, optimize ATS keywords, track interview preparations, and draft tailored outreach campaigns.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Professional Title / Headline
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-sm hover:shadow-md hover:shadow-indigo-100 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            <span>{isLoading ? "Please wait..." : (isSignUp ? "Register Account" : "Sign In to Workspace")}</span>
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold">
            <span className="bg-white px-3 text-slate-400 font-sans">Or Continue With</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer transform active:scale-95 disabled:opacity-50 font-sans shadow-xs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.97 1 12 1 7.24 1 3.2 3.73 1.24 7.74l3.85 2.99C6.01 7.21 8.81 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.48c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.65-5.02 3.65-8.65z"
            />
            <path
              fill="#FBBC05"
              d="M5.09 14.75a7.16 7.16 0 0 1 0-4.5l-3.85-2.99a11.96 11.96 0 0 0 0 10.49l3.85-3z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.51 1.18-4.2 1.18-3.19 0-5.99-2.17-6.91-5.69L1.24 16.26C3.2 20.27 7.24 23 12 23z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsSignUp(prev => !prev)}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account yet? Register here"}
          </button>
        </div>
      </div>
    </div>
  );
}
