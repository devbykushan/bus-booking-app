import re

with open('frontend/src/components/passenger/BusCard.tsx', 'r') as f:
    content = f.read()

# Replace the hardcoded price logic
old_logic = "const validatedPriceVal = isNormalBus ? 1160 : isLuxuryBus ? 2670 : (route.priceStarting || 1160);"
new_logic = "const validatedPriceVal = route.priceStarting || (isNormalBus ? 1160 : isLuxuryBus ? 2670 : 1160);"

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open('frontend/src/components/passenger/BusCard.tsx', 'w') as f:
        f.write(content)
    print("Patched BusCard.tsx price logic")
else:
    print("Could not find the price logic in BusCard.tsx")
