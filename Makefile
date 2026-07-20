SHELL := /bin/bash

.DEFAULT_GOAL := help

.PHONY: help format format-all

help:
	@printf "Herdr plugins targets:\n"
	@printf "  format      format working-tree changes and lint with fmtkit\n"
	@printf "  format-all  format every file and lint with fmtkit\n"

# fmtkit (https://github.com/oullin/fmtkit) formats and lints TypeScript.
# Install: brew tap oullin/fmtkit && brew install --cask fmtkit
# Upgrade: brew upgrade --cask fmtkit
format:
	fmtkit format --ts

format-all:
	fmtkit format-all --ts
