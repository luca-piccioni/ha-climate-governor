FROM mcr.microsoft.com/devcontainers/python:1-3.13-bookworm

RUN rm -f /etc/apt/sources.list.d/yarn.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libffi-dev libjpeg-dev libudev-dev \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir uv