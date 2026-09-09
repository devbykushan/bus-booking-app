import re

with open('frontend/src/components/passenger/SchedulesDashboard.tsx', 'r') as f:
    content = f.read()

old_filter = """      // Bus class / type filter
      if (busTypeFilter !== 'all') {"""

new_filter = """      // Departure Date Filter (Calendar Mode)
      if (searchDate && route.departureDate && route.departureDate !== searchDate) {
        return false;
      }

      // Bus class / type filter
      if (busTypeFilter !== 'all') {"""

if old_filter in content:
    content = content.replace(old_filter, new_filter)
    with open('frontend/src/components/passenger/SchedulesDashboard.tsx', 'w') as f:
        f.write(content)
    print("Patched SchedulesDashboard.tsx")
else:
    print("Could not find the filter block")
