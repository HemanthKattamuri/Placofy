              {/* Profile Icon Dropdown Container */}
              <div className="relative shrink-0" id="three-dot-menu-container">
                  <button
                    type="button"
                    id="btn-more-options"
                    onClick={() => {
                      setIsMoreMenuOpen(prev => !prev);
                      setProfileDropdownTab("menu"); // always reset tab when opening
                    }}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 rounded-xl transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 cursor-pointer shadow-3xs transform active:scale-95 hover:-translate-y-0.5"
                    title="User Profile & Quick Tools"
                    aria-label="User profile and options"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-extrabold text-xs select-none shadow-inner shrink-0">
                      {userProfile.name ? userProfile.name[0].toUpperCase() : "U"}
                    </div>
                    <div className="text-left hidden sm:block select-none max-w-[100px]">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                        {userProfile.name || "User"}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-none">
                        Workspace
                      </p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  </button>
                  {/* Dropdown Menu */}
                  {isMoreMenuOpen && (
                    <>
                      {/* Backdrop to close */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsMoreMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50 origin-top-right animate-in fade-in slide-in-from-top-2 duration-100 max-h-[480px] overflow-y-auto">

                        {profileDropdownTab === "menu" ? (
                          <>
                            {/* Profile Info Header Section */}
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 rounded-t-2xl flex flex-col items-center text-center">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md mb-2">
                                {userProfile.name ? userProfile.name[0].toUpperCase() : "U"}
                              </div>
                              <p className="font-bold text-xs text-slate-800 dark:text-white line-clamp-1">{userProfile.name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-400 line-clamp-1 font-semibold">{userProfile.title}</p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-400 line-clamp-1 font-mono mt-0.5">{userProfile.email}</p>

                              <button
                                type="button"
                                onClick={() => {
                                  setViewMode("profile");
                                  setIsMoreMenuOpen(false);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="mt-2.5 w-full py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/45 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-3xs"
                              >
                                <User className="h-3 w-3 text-indigo-500" />
                                View / Edit Profile
                              </button>
                            </div>

                            {/* Theme and Notification quick actions inside profile dropdown */}
                            <div className="grid grid-cols-2 gap-2 p-2.5 border-b border-slate-100 dark:border-slate-700">
                              {/* Theme Toggle */}
                              <button
                                type="button"
                                onClick={() => setIsDarkMode(prev => !prev)}
                                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/45 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200/60 dark:border-slate-700/80 text-[10px] font-bold cursor-pointer transition-all shadow-3xs"
                              >
                                {isDarkMode ? (
                                  <>
                                    <Sun className="h-3.5 w-3.5 text-amber-500 fill-amber-100" />
                                    <span>Light Mode</span>
                                  </>
                                ) : (
                                  <>
                                    <Moon className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>Dark Mode</span>
                                  </>
                                )}
                              </button>

                              {/* Notifications Switch */}
                              <button
                                type="button"
                                onClick={() => setProfileDropdownTab("notifications")}
                                className="relative flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/45 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200/60 dark:border-slate-700/80 text-[10px] font-bold cursor-pointer transition-all shadow-3xs"
                              >
                                <Bell className="h-3.5 w-3.5 text-indigo-500" />
                                <span>Alerts ({notifications.filter(n => !n.isRead).length})</span>
                                {notifications.some(n => !n.isRead) && (
                                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                )}
                              </button>
                            </div>

                            {/* Section 1: Smart Filter Options */}
                            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 mb-1 mt-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Smart Filters
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setHideRejected(prev => !prev);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-900 transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                                <span>Hide Rejected & Closed</span>
                              </div>
                              <div className={`h-2.5 w-2.5 rounded-full transition-all ${hideRejected ? 'bg-indigo-600 scale-110 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-200'}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setShowRemoteOnly(prev => !prev);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-900 transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Laptop className="h-3.5 w-3.5 text-slate-400" />
                                <span>Show Remote Only</span>
                              </div>
                              <div className={`h-2.5 w-2.5 rounded-full transition-all ${showRemoteOnly ? 'bg-indigo-600 scale-110 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-200'}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setShowWithDeadlines(prev => !prev);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-900 transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span>Show with Deadlines</span>
                              </div>
                              <div className={`h-2.5 w-2.5 rounded-full transition-all ${showWithDeadlines ? 'bg-indigo-600 scale-110 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-200'}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                setHideRejected(false);
                                setShowRemoteOnly(false);
                                setShowWithDeadlines(false);
                                setStatusFilter("");
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Filter className="h-3.5 w-3.5" />
                              <span>Reset All Filters</span>
                            </button>

                            {/* Section: Custom Hubs */}
                            <div className="px-3 py-1.5 border-b border-t border-slate-100 my-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Career Navigation
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setViewMode("resumes");
                                setIsMoreMenuOpen(false);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${viewMode === "resumes" ? "text-indigo-600 bg-indigo-50/70" : "text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                              <FileText className="h-3.5 w-3.5 text-indigo-500" />
                              <span>My Resume Storage</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setViewMode("notes");
                                setIsMoreMenuOpen(false);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${viewMode === "notes" ? "text-indigo-600 bg-indigo-50/70" : "text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                              <Notebook className="h-3.5 w-3.5 text-indigo-500" />
                              <span>Notes &amp; Wishlist Hub</span>
                            </button>

                            {/* Section 2: Quick Tools & Export */}
                            <div className="px-3 py-1.5 border-b border-t border-slate-100 my-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Quick Tools & Export
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                const formatToCSV = (apps: any[]): string => {
                                  const headers = ["Company", "Role", "Status", "Location", "Salary Range", "Date Applied", "Deadline", "Source", "URL", "Notes"];
                                  const rows = apps.map(app => [
                                    app.company,
                                    app.role,
                                    app.status,
                                    app.location || "",
                                    app.salaryRange || "",
                                    app.dateApplied || "",
                                    app.deadline || "",
                                    app.source + (app.customSource ? ` (${app.customSource})` : ""),
                                    app.url || "",
                                    (app.notes || "").replace(/"/g, '""')
                                  ]);
                                  return [
                                    headers.join(","),
                                    ...rows.map(row => row.map(val => `"${val}"`).join(","))
                                  ].join("\n");
                                };
                                const csvContent = formatToCSV(applications);
                                const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
                                const downloadAnchor = document.createElement('a');
                                downloadAnchor.setAttribute("href", dataStr);
                                downloadAnchor.setAttribute("download", `placofy_applications_${TODAY_DATE}.csv`);
                                document.body.appendChild(downloadAnchor);
                                downloadAnchor.click();
                                downloadAnchor.remove();
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <FileText className="h-3.5 w-3.5 text-indigo-500" />
                              Download CSV Sheet
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                const formatToText = (apps: any[]): string => {
                                  let txt = `==================================================\n`;
                                  txt += `       PLACOFY - MY JOB APPLICATIONS SUMMARY    \n`;
                                  txt += `       Generated on: ${new Date().toLocaleDateString()}\n`;
                                  txt += `==================================================\n\n`;
                                  apps.forEach((app, idx) => {
                                    txt += `[${idx + 1}] ${app.company} - ${app.role}\n`;
                                    txt += `--------------------------------------------------\n`;
                                    txt += `• Status: ${app.status}\n`;
                                    txt += `• Location: ${app.location || "N/A"}\n`;
                                    txt += `• Salary Range: ${app.salaryRange || "N/A"}\n`;
                                    txt += `• Date Applied: ${app.dateApplied || "N/A"}\n`;
                                    txt += `• Deadline: ${app.deadline || "N/A"}\n`;
                                    txt += `• Source: ${app.source}${app.customSource ? ` (${app.customSource})` : ""}\n`;
                                    txt += `• Job URL: ${app.url || "N/A"}\n`;
                                    txt += `• Notes: ${app.notes || "None"}\n\n`;
                                  });
                                  txt += `==================================================\n`;
                                  txt += `End of Export. Total Tracked: ${apps.length} applications.\n`;
                                  return txt;
                                };
                                const textContent = formatToText(applications);
                                const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(textContent);
                                const downloadAnchor = document.createElement('a');
                                downloadAnchor.setAttribute("href", dataStr);
                                downloadAnchor.setAttribute("download", `placofy_applications_${TODAY_DATE}.txt`);
                                document.body.appendChild(downloadAnchor);
                                downloadAnchor.click();
                                downloadAnchor.remove();
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <FileText className="h-3.5 w-3.5 text-indigo-500" />
                              Download TEXT File (.txt)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                const countByStatus = {
                                  Wishlist: applications.filter(a => a.status === "Wishlist").length,
                                  Applied: applications.filter(a => a.status === "Applied").length,
                                  Interview: applications.filter(a => a.status === "Interview").length,
                                  Offer: applications.filter(a => a.status === "Offer").length,
                                  Rejected: applications.filter(a => a.status === "Rejected").length,
                                };
                                const statsText = `My Job Search Progress Update 📈\n\n` +
                                  `🎯 Total Tracked: ${applications.length}\n` +
                                  `⭐ Wishlist: ${countByStatus.Wishlist}\n` +
                                  `📝 Applied: ${countByStatus.Applied}\n` +
                                  `👥 Interviewing: ${countByStatus.Interview}\n` +
                                  `🎉 Offers Received: ${countByStatus.Offer}\n` +
                                  `❌ Rejected/Closed: ${countByStatus.Rejected}\n\n` +
                                  `Generated via Placofy! Keep pushing forward! 💪🚀`;
                                navigator.clipboard.writeText(statsText);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Share2 className="h-3.5 w-3.5 text-indigo-500" />
                              Copy Progress Summary
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                setSortField("company");
                                setSortOrder("asc");
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <ArrowUpDown className="h-3.5 w-3.5 text-indigo-500" />
                              Sort by Company (A-Z)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                setSortField("dateApplied");
                                setSortOrder("desc");
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <ArrowUpDown className="h-3.5 w-3.5 text-indigo-500" />
                              Sort by Recent Applied
                            </button>

                            {/* Section 3: Reset & Clear */}
                            <div className="px-3 py-1.5 border-b border-t border-slate-100 my-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                System Actions
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                setApplications([]);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                              Clear All Data
                            </button>

                            {/* Section 4: Account Actions */}
                            <div className="px-3 py-1.5 border-b border-t border-slate-100 my-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Account
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                setIsMoreMenuOpen(false);
                                try {
                                  await signOut(auth);
                                } catch (e) {
                                  console.error("Firebase signOut failed:", e);
                                }
                                localStorage.removeItem("placofy_user_logged");
                                setIsLoggedIn(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors flex items-center gap-2 cursor-pointer rounded-b-xl"
                            >
                              <LogOut className="h-3.5 w-3.5 text-rose-500" />
                              Sign Out of Workspace
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Notification Tab Content */}
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 rounded-t-2xl flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setProfileDropdownTab("menu")}
                                className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                <span>Back</span>
                              </button>
                              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Bell className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                                Alerts
                              </h3>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                                  }}
                                  className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                >
                                  Read All
                                </button>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNotifications([]);
                                  }}
                                  className="text-[9px] font-bold text-rose-500 hover:underline cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
                              {notifications.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                                  <CheckCircle className="h-8 w-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                                  All caught up! No notifications.
                                </div>
                              ) : (
                                notifications.map(notif => (
                                  <div
                                    key={notif.id}
                                    className={`p-3.5 flex gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${!notif.isRead ? "bg-indigo-50/25 dark:bg-indigo-950/10" : ""
                                      }`}
                                  >
                                    <div className="mt-0.5 shrink-0">
                                      {notif.type === "success" && <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />}
                                      {notif.type === "deadline" && <AlertTriangle className="h-4.5 w-4.5 text-rose-500 animate-bounce" />}
                                      {notif.type === "info" && <Briefcase className="h-4.5 w-4.5 text-blue-500" />}
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{notif.title}</p>
                                        <span className="text-[9px] font-medium text-slate-400 font-mono shrink-0">{notif.time}</span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{notif.message}</p>
                                      <div className="flex gap-2.5 pt-1">
                                        {!notif.isRead && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                                            }}
                                            className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                          >
                                            Mark read
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setNotifications(prev => prev.filter(n => n.id !== notif.id));
                                          }}
                                          className="text-[9px] font-bold text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:underline"
                                        >
                                          Dismiss
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
