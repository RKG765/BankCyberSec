# Bank Cybersecurity Platform

A prototype banking platform with integrated Intrusion Detection and Prevention System (IDS/IPS) features. This project demonstrates how security can be embedded in a financial web application.

## Features

- User authentication (login/register)
- Secure transaction processing
- Basic IDS/IPS system that monitors for:
  - Large transactions (>$10,000)
  - Frequent transactions (5+ in 1 hour)
  - Unusual recipient patterns
- Transaction history
- Security alerts

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm (Node Package Manager)

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd bank-cybersecurity-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
   - Create a MySQL database named `bank_security`
   - Import the database schema:
```bash
mysql -u root -p < database.sql
```

4. Configure environment variables:
   Create a `.env` file in the root directory with the following content:
```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=bank_security
JWT_SECRET=your-secret-key
PORT=3000
```

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

6. Access the application:
   Open your browser and navigate to `http://localhost:3000`

## Security Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Password hashing with bcrypt
   - Protected API endpoints

2. **Transaction Security**
   - Rate limiting
   - Suspicious activity detection
   - Security logging

3. **Application Security**
   - Helmet.js for security headers
   - CORS protection
   - Input validation
   - SQL injection prevention

## Project Structure

```
bank-cybersecurity-platform/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── routes/
│   ├── auth.js
│   └── transactions.js
├── database.sql
├── server.js
├── package.json
└── README.md
```

## Testing the IDS/IPS

To test the intrusion detection system:
1. Create an account and log in
2. Try making multiple transactions in quick succession
3. Attempt a large transaction (>$10,000)
4. Use unusual characters in the recipient field

The system will flag suspicious activities and log them in the security logs.

## Contributing

Feel free to submit issues and enhancement requests! 