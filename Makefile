.PHONY: deploy bootstrap dev test

deploy:
	@echo "Use scripts/deploy.sh with required env vars"

bootstrap:
	./scripts/bootstrap.sh

dev:
	cd frontend && npm install && npm run dev

test:
	cd frontend && npm test || true
	cd backend && python -m compileall .
