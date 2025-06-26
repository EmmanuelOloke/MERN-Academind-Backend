# Makefile for Docker Compose local development

up:
	docker-compose -f local.yml up --build

down:
	docker-compose -f local.yml down

restart:
	docker-compose -f local.yml down && docker-compose -f local.yml up --build

logs:
	docker-compose -f local.yml logs -f

ps:
	docker-compose -f local.yml ps

backend:
	docker-compose -f local.yml exec backend sh

postgres:
	docker-compose -f local.yml exec postgres bash

migrate-up:
	docker-compose -f local.yml exec backend npx node-pg-migrate up

migrate-down:
	docker-compose -f local.yml exec backend npx node-pg-migrate down

migrate-create:
	docker-compose -f local.yml exec backend npx node-pg-migrate create $(name)

migrate-status:
	docker-compose -f local.yml exec backend npx node-pg-migrate status

install-migrate:
	docker-compose -f local.yml exec backend npm install node-pg-migrate --save-dev
	# make install-migrate
