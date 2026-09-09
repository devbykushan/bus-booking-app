with open('frontend/vite.config.ts', 'r') as f:
    content = f.read()

old_config = "registerType: 'autoUpdate',"
new_config = """registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true
      },"""

if old_config in content:
    content = content.replace(old_config, new_config)
    with open('frontend/vite.config.ts', 'w') as f:
        f.write(content)
    print("Patched vite.config.ts")
