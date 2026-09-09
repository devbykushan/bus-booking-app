with open('frontend/src/main.tsx', 'r') as f:
    content = f.read()

unregister_code = """
// ─── Development Only: Unregister Rogue Service Workers ─────────────────────
// This prevents older production PWA builds from caching assets during active development.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}
"""

if "unregister(" not in content:
    with open('frontend/src/main.tsx', 'w') as f:
        f.write(unregister_code + "\n" + content)
    print("Patched main.tsx")
