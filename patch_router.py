import re

with open('backend/src/routes/routesRouter.ts', 'r') as f:
    content = f.read()

# Replace the GET /api/routes logic
old_get = """routesRouter.get('/', async (_req: Request, res: Response) => {
  const pool = getPool();

  try {
    const rawRoutesRes = await pool.query('SELECT * FROM routes ORDER BY "operatorName"');"""

new_get = """routesRouter.get('/', async (req: Request, res: Response) => {
  const pool = getPool();
  const dateFilter = req.query.date as string;

  try {
    let query = 'SELECT * FROM routes';
    let params: any[] = [];
    if (dateFilter) {
      query += ' WHERE "departureDate" = $1';
      params.push(dateFilter);
    }
    query += ' ORDER BY "operatorName"';
    
    const rawRoutesRes = await pool.query(query, params);"""

content = content.replace(old_get, new_get)

# Also need to update the INSERT query in the PUT route to include departureDate if it's there?
# Actually the PUT route updates existing ones. We might not need to touch it if they don't update date from admin panel.

with open('backend/src/routes/routesRouter.ts', 'w') as f:
    f.write(content)
print("Patched routesRouter.ts")
