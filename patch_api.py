with open('frontend/src/services/api.ts', 'r') as f:
    content = f.read()

old_get_all = "getAll: (): Promise<any[]> => apiFetch('/routes'),"
new_get_all = "getAll: (date?: string): Promise<any[]> => apiFetch(`/routes${date ? `?date=${date}` : ''}`),"

if old_get_all in content:
    content = content.replace(old_get_all, new_get_all)
    with open('frontend/src/services/api.ts', 'w') as f:
        f.write(content)
    print("Patched api.ts")
else:
    print("Could not find getAll signature in api.ts")
