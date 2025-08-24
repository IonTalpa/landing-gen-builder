# Landing-Gen Builder

> Production-ready WordPress Block Theme Generator with live preview and clean export

Landing-Gen is a powerful monorepo web application that enables users to create professional WordPress block themes for landing pages through fully manual inputs (no presets). Features real-time preview capabilities through WordPress Playground and exports clean WordPress theme ZIP files with zero AI traces.

## ✨ Features

- **🎨 Manual Control**: Complete user control over design elements without AI-driven presets
- **⚡ Live Preview**: Real-time WordPress Playground integration for immediate theme testing  
- **📦 Clean Export**: Production-ready WordPress themes with no AI footprints
- **🌙 Dark-First UI**: Professional dark theme interface for enhanced user experience
- **🔒 Secure**: Single-user authentication with CSRF protection
- **🚀 Production Ready**: Docker support with Coolify deployment configuration

## 🛠️ Technology Stack

### Core Framework
- **Next.js 14+** with App Router, TypeScript, React Server Components
- **Tailwind CSS** with dark mode configuration
- **clsx** for conditional styling

### Backend & Database  
- **Prisma ORM** with SQLite database
- **iron-session** for authentication with CSRF protection
- **File System Storage** for persistent file storage

### Specialized Libraries
- **node-vibrant** for color extraction from logos
- **JSZip** for WordPress theme packaging
- **sharp** for image processing and EXIF stripping
- **WordPress Playground** for seamless theme preview integration

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- npm or yarn
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/IonTalpa/landing-gen-builder.git
   cd landing-gen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your environment variables:
   ```env
   # Required
   SESSION_SECRET="your-secure-session-secret-here"
   CSRF_SECRET="your-csrf-secret-here"
   APP_USER="username"
   APP_PASS="your-secure-password"
   
   # Optional (for AI features)
   AI_API_KEY="your-ai-api-key"
   ```

4. **Initialize database**
   ```bash
   npm run prisma:migrate
   npm run seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open http://localhost:3000
   - Login with your configured credentials

## 🐳 Docker Deployment

### Docker Compose (Recommended)

1. **Clone and configure**
   ```bash
   git clone <repository-url>
   cd landing-gen
   cp .env.example .env
   ```

2. **Edit environment variables in .env**
   ```env
   SESSION_SECRET="production-session-secret"
   CSRF_SECRET="production-csrf-secret"
   BASE_URL="https://your-domain.com"
   APP_USER="your-username"
   APP_PASS="your-secure-password"
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Initialize database (first time only)**
   ```bash
   docker-compose exec landing-gen npx prisma migrate deploy
   docker-compose exec landing-gen npm run seed
   ```

### Development with Docker

```bash
# Start development environment
docker-compose --profile dev up -d landing-gen-dev

# View logs
docker-compose logs -f landing-gen-dev
```

## ☁️ Coolify Deployment

Landing-Gen is optimized for [Coolify](https://coolify.io) deployment.

### Coolify Setup

1. **Create new application in Coolify**
   - Source: Git repository
   - Build pack: Docker
   - Port: 3000

2. **Environment Variables**
   Set these environment variables in Coolify:
   ```env
   NODE_ENV=production
   DATABASE_URL=file:/app/data/db.sqlite
   UPLOAD_DIR=/app/data/uploads
   EXPORT_DIR=/app/data/exports
   SESSION_SECRET=your-secure-session-secret
   CSRF_SECRET=your-csrf-secret
   BASE_URL=https://your-domain.com
   APP_USER=your-username
   APP_PASS=your-secure-password
   AI_API_KEY=your-ai-api-key (optional)
   ```

3. **Persistent Storage**
   - Add persistent volume: `/app/data`
   - This stores database, uploads, and exports

4. **Deploy**
   - Build and deploy through Coolify interface
   - Access your application at your configured domain

### Post-Deployment Setup

After first deployment, initialize the database:

```bash
# SSH into your container or use Coolify console
npx prisma migrate deploy
npm run seed
```

## 📁 Project Structure

```
landing-gen/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── login/             # Authentication
│   │   ├── project/           # Project management
│   │   └── uploads/           # File serving
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── layout/           # Layout components
│   │   └── project/          # Project-specific components
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts           # Authentication
│   │   ├── db.ts             # Database client
│   │   ├── config.ts         # Configuration
│   │   └── upload.ts         # File upload utilities
│   └── types/                # TypeScript type definitions
├── prisma/                   # Database schema and migrations
├── data/                     # Persistent data (created at runtime)
│   ├── db.sqlite            # SQLite database
│   ├── uploads/             # Uploaded files
│   └── exports/             # Generated exports
├── docker-compose.yml        # Docker composition
├── Dockerfile               # Container definition
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./data/db.sqlite` | Database connection string |
| `SESSION_SECRET` | Yes | - | Secret for session encryption |
| `CSRF_SECRET` | Yes | - | Secret for CSRF protection |
| `APP_USER` | Yes | `aydin` | Application username |
| `APP_PASS` | Yes | - | Application password |
| `BASE_URL` | Yes | `http://localhost:3000` | Application base URL |
| `UPLOAD_DIR` | No | `./data/uploads` | Upload directory path |
| `EXPORT_DIR` | No | `./data/exports` | Export directory path |
| `AI_API_KEY` | No | - | AI API key for generation |
| `MAX_FILE_SIZE` | No | `10485760` | Max upload size (bytes) |

### Security Configuration

- **Sessions**: 7-day expiry, HTTP-only cookies
- **CSRF**: Token-based protection on all mutations
- **File Upload**: Type validation, size limits, EXIF stripping
- **Rate Limiting**: Configurable per endpoint

## 🎯 Usage Guide

### Creating Your First Project

1. **Login** with your configured credentials
2. **Create Project**: Click "New Project" on dashboard
3. **Configure Brand**: Upload logo, set colors, choose fonts
4. **Add Assets**: Upload hero images and gallery photos
5. **Write Content**: Add headlines, benefits, and contact info
6. **Arrange Layout**: Order your page sections
7. **Generate Theme**: Create WordPress theme from your config
8. **Preview**: View in HTML or WordPress Playground
9. **Export**: Download clean WordPress theme ZIP

### Brand Configuration

- **Logo Upload**: SVG, PNG, JPEG up to 5MB
- **Color Extraction**: Auto-extract palette from logo
- **Color Locking**: Prevent AI from modifying specific colors
- **Typography**: Choose from web-safe and Google Fonts

### WordPress Integration

- **Block Themes**: Uses WordPress 6.5+ block system
- **Playground Preview**: Live preview without server setup
- **Clean Export**: No AI traces in final theme files
- **Production Ready**: Follows WordPress coding standards

## 🛡️ Security Features

- **Single User Auth**: Simple username/password authentication
- **CSRF Protection**: Token-based request validation
- **File Validation**: Strict upload type and size limits
- **EXIF Stripping**: Removes metadata from uploaded images
- **Content Scanning**: Prevents AI references in exports

## 📊 API Reference

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Project Management

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### File Operations

- `POST /api/upload` - Upload files
- `GET /uploads/[...path]` - Serve uploaded files
- `POST /api/extract-colors` - Extract colors from logo

### Health Check

- `GET /api/health` - Application health status

## 🔍 Troubleshooting

### Common Issues

**Database locked errors**
```bash
# Stop application and reset database
docker-compose down
docker volume rm landing-gen_landing_gen_data
docker-compose up -d
```

**File upload failures**
- Check disk space in `/app/data` volume
- Verify file permissions for `nextjs` user
- Ensure file size under limits

**Theme generation issues**
- Verify AI API key configuration
- Check for locked colors causing conflicts
- Review application logs for specific errors

### Logs and Debugging

```bash
# View application logs
docker-compose logs -f landing-gen

# Access container shell
docker-compose exec landing-gen sh

# Check health status
curl http://localhost:3000/api/health
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- WordPress Playground team for seamless integration
- Vibrant.js for color extraction capabilities
- Next.js team for the excellent framework
- Tailwind CSS for the utility-first styling

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check existing documentation
- Review troubleshooting guide

---

**Made with ❤️ for WordPress developers and designers**
