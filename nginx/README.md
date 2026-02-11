# Nginx Configuration

## SSL Certificates for Production

For production, you need to add SSL certificates to `nginx/ssl/` directory:

```bash
nginx/ssl/
├── fullchain.pem   # Full certificate chain
└── privkey.pem     # Private key
```

### Getting SSL Certificates

#### Option 1: Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
```

#### Option 2: Self-Signed (Development/Testing Only)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Configuration Files

- `nginx.prod.conf` - Production configuration with SSL, rate limiting, load balancing
- `nginx.staging.conf` - Staging configuration, simpler setup
- `nginx.dev.conf` - Development configuration (if needed)

## Testing Configuration

```bash
# Test nginx configuration
docker run --rm -v $(pwd)/nginx:/etc/nginx:ro nginx nginx -t

# Or if nginx is installed locally
nginx -t -c nginx/nginx.prod.conf
```

## Rate Limiting

Production configuration includes rate limiting:

- API endpoints: 100 requests/second with burst of 20
- Auth endpoints: 5 requests/second with burst of 5

Adjust these in `nginx.prod.conf` if needed.
