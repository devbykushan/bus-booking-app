import re

with open('frontend/src/components/passenger/SchedulesDashboard.tsx', 'r') as f:
    content = f.read()

old_deps = "}, [routes, searchOrigin, searchDestination, busTypeFilter, timeFilter, sortBy]);"
new_deps = "}, [routes, searchOrigin, searchDestination, searchDate, busTypeFilter, timeFilter, sortBy]);"

if old_deps in content:
    content = content.replace(old_deps, new_deps)
    with open('frontend/src/components/passenger/SchedulesDashboard.tsx', 'w') as f:
        f.write(content)
    print("Patched SchedulesDashboard dependencies")
else:
    print("Could not find dependencies block")
