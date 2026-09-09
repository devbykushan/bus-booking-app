with open('frontend/src/mockData/mockData.ts', 'r') as f:
    content = f.read()

content = content.replace("destination: 'Colombo',", "destination: 'Colombo',\n    departureDate: '2026-08-20',")
content = content.replace("destination: 'Monaragala',", "destination: 'Monaragala',\n    departureDate: '2026-08-20',")
content = content.replace("destination: 'Jaffna',", "destination: 'Jaffna',\n    departureDate: '2026-08-20',")
content = content.replace("destination: 'Galle',", "destination: 'Galle',\n    departureDate: '2026-08-20',")
content = content.replace("destination: 'Kandy',", "destination: 'Kandy',\n    departureDate: '2026-08-20',")

with open('frontend/src/mockData/mockData.ts', 'w') as f:
    f.write(content)

with open('frontend/src/components/admin/RouteDeploymentForm.tsx', 'r') as f:
    content = f.read()

content = content.replace("destination: formData.destination,", "destination: formData.destination,\n      departureDate: new Date().toISOString().split('T')[0],")

with open('frontend/src/components/admin/RouteDeploymentForm.tsx', 'w') as f:
    f.write(content)
