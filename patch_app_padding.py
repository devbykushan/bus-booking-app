with open('frontend/src/App.tsx', 'r') as f:
    content = f.read()

old_main = "className={`flex-1 transition-all duration-300 ${currentView === 'passenger-search' ? '' : 'pt-20 md:pt-24'}`}"
new_main = "className={`flex-1 transition-all duration-300 pb-20 md:pb-0 ${currentView === 'passenger-search' ? '' : 'pt-20 md:pt-24'}`}"

if old_main in content:
    content = content.replace(old_main, new_main)
    with open('frontend/src/App.tsx', 'w') as f:
        f.write(content)
    print("Patched App.tsx padding")
else:
    print("Could not find main tag padding")
