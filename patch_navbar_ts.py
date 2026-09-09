import re

with open('frontend/src/components/common/Navbar.tsx', 'r') as f:
    content = f.read()

content = content.replace("Menu, X, ", "")
content = content.replace("const [mobileOpen, setMobileOpen] = useState(false);", "")
content = content.replace("setMobileOpen(false);", "")

with open('frontend/src/components/common/Navbar.tsx', 'w') as f:
    f.write(content)
