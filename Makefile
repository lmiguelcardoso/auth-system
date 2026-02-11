.PHONY: help install up down restart logs db-shell migrate seed dev build lint test clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make up         - Start Docker containers"
	@echo "  make down       - Stop Docker containers"
	@echo "  make restart    - Restart Docker containers"
	@echo "  make logs       - View Docker logs"
	@echo "  make db-shell   - Open PostgreSQL shell"
	@echo "  make migrate    - Run database migrations"
	@echo "  make seed       - Seed database with initial data"
	@echo "  make dev        - Run app in development mode"
	@echo "  make build      - Build the application"
	@echo "  make lint       - Run linter and fix issues"
	@echo "  make test       - Run tests"
	@echo "  make clean      - Stop containers and remove volumes"

# Install dependencies
install:
	npm install

# Docker commands
up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

db-shell:
	docker-compose exec postgres psql -U postgres -d auth_system

# Database commands
migrate:
	npm run migration:run

seed:
	npm run seed

# Development commands
dev:
	npm run start:dev

build:
	npm run build

lint:
	npm run lint

test:
	npm run test

# Clean up
clean:
	docker-compose down -v
	rm -rf dist node_modules
