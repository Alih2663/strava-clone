#STRAVA CLONE

- DOCKER AND EC2 WITH TERRAFORM APPLIED --

Developed a simplified Strava-style platform that allows users to share their running and cycling activities with friends. The system is composed of two Express-based backend servers connected to a MongoDB database, and a dedicated Express server that handles a fully responsive frontend built with Next.js.

The platform supports email and Google authentication, GPX file uploads, activity comments, friend connections, and likes. I also implemented a real-time chat system using Socket.io, designed to scale to millions of simultaneous users. To achieve high performance and low latency, message caching and communication layers are optimized through a Redis database. 

