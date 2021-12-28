.PHONY: deps

deps: reqs
	python3 -m venv .venv; \
	. .venv/bin/activate; \
	pip3 install -U pip
	pip3 install -U wheel
	pip3 install -r reqs.txt

reqs:
	pip3 install virtualenv

run:
	jupyter notebook