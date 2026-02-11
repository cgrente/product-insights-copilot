SHELL := /bin/bash

.PHONY: help install dev dev-api dev-web build typecheck test test-api test-web clean \
        docker-build docker-up docker-down docker-logs

help:
	@echo "Targets:"
	@echo "  install      Install dependencies"
	@echo "  dev          Run api + web in dev (two terminals recommended)"
	@echo "  dev-api       Run API dev server"
	@echo "  dev-web       Run Web dev server"
	@echo "  build        Build all packages"
	@echo "  typecheck    Typecheck all packages"
	@echo "  test         Run all tests"
	@echo "  clean        Remove build artifacts"
	@echo "  docker-build Build Docker images"
	@echo "  docker-up    Start docker compose"
	@echo "  docker-down  Stop docker compose"
	@echo "  docker-logs  Tail docker compose logs"

install:
	pnpm install

dev-api:
	pnpm -C apps/api dev

dev-web:
	pnpm -C apps/web dev

build:
	pnpm -r build

typecheck:
	pnpm -r typecheck

test:
	pnpm -r test

test-api:
	pnpm -C apps/api test

test-web:
	pnpm -C apps/web test

clean:
	rm -rf **/dist **/build **/coverage

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f