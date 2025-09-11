const jwt = require("jsonwebtoken");

// paste your token here
// const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjhiOTUwN2VlNDExNWExMjBlODMyODMwIiwiaWF0IjoxNzU2OTg3MjUyfQ.X8M76xZtTPRWKhGRFrJKqAFa9PyBPWD2gA_CUkIjXx8";
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjhiOTUwN2VlNDExNWExMjBlODMyODMwIiwiaWF0IjoxNzU2OTg3OTM3fQ.EmCeqnS2R_7wS-PUOSHSYlzyuKY7b-UUB-SGGsP_Sjk'
// paste the exact secret you're using (from .env or fallback)
const secret = process.env.JWT_TOKEN_SECRET || "orama_solutions";
console.log('Secret Key in verify>>>', secret);
try {
  const decoded = jwt.verify(token.trim(), secret);
  console.log("✅ Token is valid!");
  console.log("Decoded payload >>>", decoded);
} catch (err) {
  console.error("❌ Invalid token!");
  console.error(err.message);
}
