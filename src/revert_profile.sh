#!/bin/bash
FILE="/Users/hemanthkattamuri/Placofy/src/App.tsx"

# Extract parts
sed -n '1,1642p' "$FILE" > part1.tsx
sed -n '2116,2157p' "$FILE" > part2.tsx
sed -n '1643,2115p' "$FILE" > profile_block.tsx
sed -n '2158,$p' "$FILE" > part3.tsx

# Create separator
cat << 'INLINE' > sep.tsx
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1"></div>
INLINE

# Combine
cat part1.tsx part2.tsx sep.tsx profile_block.tsx part3.tsx > "$FILE"
echo "Profile block moved back to right side."
