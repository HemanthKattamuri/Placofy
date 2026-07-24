#!/bin/bash
FILE="/Users/hemanthkattamuri/Placofy/src/App.tsx"

# Extract Profile Block (lines 1685 to 2157)
sed -n '1685,2157p' "$FILE" > profile_block.tsx

# Create Part 1 (lines 1 to 1637)
sed -n '1,1637p' "$FILE" > part1.tsx

# Create modified Clock block
cat << 'INLINE' > clock_block.tsx
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold font-sans select-none bg-slate-50/80 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/60 rounded-full px-2 py-0.5 shadow-3xs hover:bg-white hover:dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-default">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{systemTime || "July 2, 2026"}</span>
                  </div>
INLINE

# Create closing for the new flex container + Action Buttons start
cat << 'INLINE' > part2_start.tsx
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
INLINE

# Extract the rest of Action Buttons (lines 1647 to 1682)
sed -n '1647,1682p' "$FILE" > action_buttons.tsx

# Extract Part 3 (from 2158 to end)
# Wait, line 1683 is empty or divider? Let's skip it. We'll start part 3 after 2157.
sed -n '2158,$p' "$FILE" > part3.tsx

# Concatenate all parts
cat part1.tsx clock_block.tsx profile_block.tsx part2_start.tsx action_buttons.tsx part3.tsx > "$FILE"

echo "Layout restructuring applied successfully."
