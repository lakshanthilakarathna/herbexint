#!/bin/bash

# Script to update remaining API endpoints to async
echo "Updating remaining API endpoints to async..."

# Update the remaining endpoints in server.js
sed -i '' 's/app\.put.*\/api\/orders.*req, res) => {/app.put("\/api\/orders\/:id", async (req, res) => {/g' backend/server.js
sed -i '' 's/app\.delete.*\/api\/orders.*req, res) => {/app.delete("\/api\/orders\/:id", async (req, res) => {/g' backend/server.js
sed -i '' 's/app\.get.*\/api\/users.*req, res) => {/app.get("\/api\/users", async (req, res) => {/g' backend/server.js
sed -i '' 's/app\.get.*\/api\/users.*:id.*req, res) => {/app.get("\/api\/users\/:id", async (req, res) => {/g' backend/server.js
sed -i '' 's/app\.post.*\/api\/users.*req, res) => {/app.post("\/api\/users", async (req, res) => {/g' backend/server.js
sed -i '' 's/app\.put.*\/api\/users.*req, res) => {/app.put("\/api\/users\/:id", async (req, res) => {/g' backend/server.js
sed -i '' 's/app\.delete.*\/api\/users.*req, res) => {/app.delete("\/api\/users\/:id", async (req, res) => {/g' backend/server.js

# Update readData and writeData calls to await
sed -i '' 's/const data = readData();/const data = await readData();/g' backend/server.js
sed -i '' 's/writeData(data);/await writeData(data);/g' backend/server.js

echo "API endpoints updated to async!"
