# Request nodejs v18^
```
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install nodejs npm
```

# Run in backend
```
npm run start
```
# Database 

with [aiven.io](https://aiven.io/) (free mysql)
```
CREATE DATABASE chatdb;

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(25) NOT NULL,
  message TEXT NOT NULL,
  reply_to TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Change this to [aiven.io](https://aiven.io/) your database link

```
const dbConfig = {
  host: 'ppppp',
  user: 'pppppp',
  password: 'ppppppp',
  database: 'pppppp',
  port: 15633,
```
