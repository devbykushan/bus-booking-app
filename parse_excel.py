import pandas as pd
import json

df1 = pd.read_excel('Normal Service_time_tables.xlsx', sheet_name='Sheet1')
df2 = pd.read_excel('Normal Service_time_tables.xlsx', sheet_name='Sheet2')

print("Sheet 1 dates:")
print(df1[['Date', 'Monaragala', 'Colombo']].head(10))
print("\nSheet 2 dates:")
print(df2[['Date', 'Monaragala', 'Colombo']].head(10))
