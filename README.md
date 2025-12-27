— CLOUD INFRASTRUCTURE & DEVOPS ENGINEERING —
Architected and deployed a containerized microservices infrastructure for a Strava-style platform on AWS EC2 using Terraform for Infrastructure as Code (IaC). I focused on building a scalable, production-ready environment to host multiple Express services and a Next.js frontend within a unified Docker network.

The core of my work involved engineering a high-performance Nginx Reverse Proxy to manage REST APIs and real-time Socket.io traffic with SSL/TLS encryption. I optimized the communication layer using Redis for low-latency message caching and designed the system for high-concurrency scaling.

The entire infrastructure is automated through a GitHub Actions CI/CD pipeline, achieving a zero-touch deployment cycle with persistent MongoDB storage and Cloudflare DNS management..