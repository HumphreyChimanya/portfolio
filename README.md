# Humphrey Chimanya Portfolio

Personal portfolio website for Humphrey Chimanya, built as a static HTML, CSS, and JavaScript site.

## Local development

The site lives in `startbootstrap-personal-portfolio/`. Open `index.html` directly in a browser, or serve the folder with a local web server:

```powershell
Set-Location startbootstrap-personal-portfolio
python -m http.server 8080
```

Then visit <http://localhost:8080>.

## Deploy with Docker

The repository includes a production-ready Nginx image. From the repository root:

```powershell
docker build -t humphrey-portfolio .
docker run --rm -p 8080:80 humphrey-portfolio
```

Then visit <http://localhost:8080>.

## Deploy on Northflank

1. Create a new service in Northflank and connect the `HumphreyChimanya/portfolio` GitHub repository.
2. Configure the service to build from the repository's `Dockerfile`.
3. Set the exposed/container port to `80` and enable public access.
4. Deploy the service. Northflank will build the image and serve the portfolio through Nginx.

No environment variables or build command are required. Every push to the configured branch can be deployed using Northflank's automatic deployment settings.

## Project structure

```text
startbootstrap-personal-portfolio/
├── assets/       # Images, favicon, and CV
├── css/          # Site styles
├── js/           # Navigation and interaction scripts
├── contact.html
├── index.html
├── projects.html
└── resume.html
```