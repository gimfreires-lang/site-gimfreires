FROM nginx:1.27-alpine
COPY index.html /usr/share/nginx/html/index.html
COPY img /usr/share/nginx/html/img
COPY explosom /usr/share/nginx/html/explosom
EXPOSE 80
